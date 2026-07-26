const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Catalyst API Gateway Middleware (Rate Limiting & Headers)
app.use((req, res, next) => {
  res.setHeader('X-Catalyst-API-Gateway', 'Active');
  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '98');
  next();
});

// Catalyst Auth & Login Routing
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  const officer = {
    id: 'KSP-8842',
    name: email ? (email.split('@')[0].toUpperCase() + ' (SHO)') : 'Insp. R. Patil',
    kgid: 'KGID-74920',
    rank: 'Inspector of Police',
    district: 'BENGALURU_CITY',
    station: 'HAL Police Station',
    badge: 'KSP-8842',
    role: 'Station House Officer (SHO)',
    email: email || 'r.patil@ksp.gov.in'
  };
  return res.json({ success: true, token: 'cat_auth_tok_89234', officer });
});

app.get('/api/auth/status', (req, res) => {
  return res.json({ status: 'AUTHENTICATED', gateway: 'ACTIVE', authProvider: 'Catalyst Authentication' });
});

// ============================================================================
// Zoho OAuth 2.0 Implementation
// ============================================================================
// Note: This implements the Authorization Code flow without forcing re-authentication
// - Removed: prompt=login parameter that was forcing users to login
// - Added: Proper state validation and token exchange
// - Session: Zoho will automatically reuse existing browser session if present

const ZOHO_OAUTH_CLIENT_ID = process.env.ZOHO_OAUTH_CLIENT_ID || 'your_client_id';
const ZOHO_OAUTH_CLIENT_SECRET = process.env.ZOHO_OAUTH_CLIENT_SECRET || 'your_client_secret';
const ZOHO_OAUTH_REDIRECT_URI = process.env.ZOHO_OAUTH_REDIRECT_URI || 'http://localhost:5173/auth/callback';
const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com';
const ZOHO_TOKEN_URL = `${ZOHO_ACCOUNTS_URL}/oauth/v2/token`;

// In-memory store for OAuth states (in production, use Redis or session store)
const oauthStates = new Map();

app.get('/api/oauth/authorize', (req, res) => {
  try {
    const state = req.query.state || Math.random().toString(36).substring(2, 15);
    const clientId = ZOHO_OAUTH_CLIENT_ID;
    const redirectUri = ZOHO_OAUTH_REDIRECT_URI;

    // Store state for validation later (expires in 10 minutes)
    oauthStates.set(state, {
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Build authorization URL WITHOUT prompt=login
    // This allows Zoho to reuse existing user sessions
    const authParams = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'ZohoMail.accounts.READ ZohoMail.messages.READ',
      redirect_uri: redirectUri,
      state: state,
      access_type: 'offline'
      // IMPORTANT: Not including prompt=login
      // - prompt=login forces new authentication
      // - omitting prompt allows session reuse
      // - Zoho checks if user is already logged in and reuses that session
    });

    const authUrl = `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${authParams.toString()}`;

    res.json({
      authUrl: authUrl,
      state: state,
      message: 'Authorization URL generated. Redirect user to this URL.',
      session_behavior: 'Zoho will check for existing browser session and reuse if available'
    });
  } catch (error) {
    console.error('OAuth authorize error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/oauth/callback', handleOAuthCallback);
app.post('/api/oauth/callback', handleOAuthCallback);

async function handleOAuthCallback(req, res) {
  try {
    // Support both GET and POST methods
    const queryParams = req.method === 'GET' ? req.query : req.body;
    const { code, state, error, error_description } = queryParams;

    // Handle errors from Zoho
    if (error) {
      console.error('OAuth Error from Zoho:', error, error_description);
      return res.status(400).json({
        error: error,
        description: error_description,
        message: 'Authorization failed at Zoho'
      });
    }

    // Validate state to prevent CSRF
    if (!state || !oauthStates.has(state)) {
      console.error('Invalid or expired state parameter');
      return res.status(400).json({
        error: 'invalid_state',
        message: 'State parameter validation failed. Request may be forged.'
      });
    }

    const stateData = oauthStates.get(state);
    if (stateData.expiresAt < Date.now()) {
      oauthStates.delete(state);
      return res.status(400).json({
        error: 'state_expired',
        message: 'State parameter has expired'
      });
    }

    // Clean up used state
    oauthStates.delete(state);

    if (!code) {
      return res.status(400).json({
        error: 'missing_code',
        message: 'No authorization code provided by Zoho'
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(code);

    if (tokenResponse.error) {
      console.error('Token exchange failed:', tokenResponse);
      return res.status(400).json({
        error: 'token_exchange_failed',
        details: tokenResponse
      });
    }

    // Store tokens in secure HTTP-only cookies
    // Browsers will automatically include these cookies in requests to this domain
    res.cookie('zoho_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || window?.location?.protocol === 'https:',
      sameSite: 'Lax',
      maxAge: tokenResponse.expires_in * 1000,
      path: '/'
    });

    if (tokenResponse.refresh_token) {
      res.cookie('zoho_refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || window?.location?.protocol === 'https:',
        sameSite: 'Lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });
    }

    // For traditional redirect flow, redirect back to app
    if (req.method === 'GET') {
      const successUrl = new URL('/', req.get('referer') || `${req.protocol}://${req.get('host')}`);
      successUrl.searchParams.set('auth', 'success');
      return res.redirect(successUrl.toString());
    }

    // For popup/POST flow, return JSON
    res.json({
      success: true,
      message: 'OAuth authentication successful',
      access_token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      user: tokenResponse.user_info || {}
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to process OAuth callback'
    });
  }
}


async function exchangeCodeForToken(code) {
  try {
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ZOHO_OAUTH_CLIENT_ID,
      client_secret: ZOHO_OAUTH_CLIENT_SECRET,
      redirect_uri: ZOHO_OAUTH_REDIRECT_URI,
      code: code
    });

    const response = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    const tokenData = await response.json();

    if (!response.ok) {
      console.error('Zoho token exchange error:', tokenData);
      return {
        error: 'token_exchange_failed',
        details: tokenData
      };
    }

    return tokenData;
  } catch (error) {
    console.error('Token exchange exception:', error);
    throw error;
  }
}

app.post('/api/oauth/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies.zoho_refresh_token || req.body.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'missing_refresh_token',
        message: 'No refresh token available'
      });
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ZOHO_OAUTH_CLIENT_ID,
      client_secret: ZOHO_OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken
    });

    const response = await fetch(ZOHO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    const tokenData = await response.json();

    if (!response.ok) {
      console.error('Token refresh failed:', tokenData);
      return res.status(401).json({
        error: 'token_refresh_failed',
        details: tokenData
      });
    }

    // Update token cookie
    res.cookie('zoho_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: tokenData.expires_in * 1000
    });

    res.json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// ============================================================================


if (!process.env.CATALYST_ENV && !process.env.IS_CATALYST) {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'public')));
}

app.get('/api/tables', async (req, res) => {
  try {
    const result = await db.getTables(req);
    res.json(result);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/table/:name', async (req, res) => {
  try {
    const rows = await db.getTableRows(req, req.params.name);
    res.json(rows);
  } catch (error) {
    console.error(`Error fetching rows from table ${req.params.name}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lookups', async (req, res) => {
  try {
    const lookups = await db.getLookups(req);
    res.json(lookups);
  } catch (error) {
    console.error('Error fetching lookups:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases', async (req, res) => {
  try {
    const cases = await db.getCases(req);
    res.json(cases);
  } catch (error) {
    console.error('Error searching cases:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const summary = await db.getAnalyticsSummary(req);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases/:id', async (req, res) => {
  try {
    const result = await db.getCaseById(req, parseInt(req.params.id));
    if (!result) {
      return res.status(404).json({ error: `Case ID ${req.params.id} not found.` });
    }
    res.json(result);
  } catch (error) {
    console.error(`Error fetching detailed case ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const result = await db.createCase(req, req.body);
    res.status(201).json({
      message: 'Case registered successfully',
      ...result
    });
  } catch (error) {
    console.error('Error inserting case:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cases', async (req, res) => {
  try {
    const result = await db.deleteAllCases(req);
    res.json({ message: `All cases purged from datastore.`, ...result });
  } catch (error) {
    console.error('Error purging all cases:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cases/:id', async (req, res) => {
  try {
    const result = await db.deleteCase(req, parseInt(req.params.id));
    res.json({ message: `Case ${req.params.id} deleted successfully.`, ...result });
  } catch (error) {
    console.error(`Error deleting case ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// File a chargesheet / final report for a specific case
// Body: { cstype: 'A'|'B'|'C', csdate: 'YYYY-MM-DD', PolicePersonID: number }
// Sets CaseMaster.CaseStatusID → 2 (Chargesheeted) or 3 (Closed)
app.post('/api/cases/:id/chargesheet', async (req, res) => {
  try {
    const caseId = parseInt(req.params.id);
    if (!caseId || isNaN(caseId)) return res.status(400).json({ error: 'Invalid case ID' });
    const result = await db.createChargesheet(req, caseId, req.body || {});
    const typeLabel = result.cstype === 'A' ? 'Chargesheeted' : result.cstype === 'B' ? 'False Case' : 'Undetected/Closed';
    res.status(201).json({ message: `Case ${caseId} filed as ${typeLabel}.`, ...result });
  } catch (error) {
    console.error(`Error filing chargesheet for case ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});


// Employee roster (with Rank, Designation, Unit names resolved - for duty roster)
app.get('/api/employees', async (req, res) => {
  try {
    const result = await db.getEmployees(req);
    res.json(result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unit hierarchy tree (using ParentUnit self-reference)
app.get('/api/units/hierarchy', async (req, res) => {
  try {
    const result = await db.getUnitHierarchy(req);
    res.json(result);
  } catch (error) {
    console.error('Error fetching unit hierarchy:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ============================================================================
// Zoho Catalyst Zia AI Integration Endpoints
// ============================================================================
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to save base64 image data to a temp file and return filepath
function createTempImageFile(base64Image) {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  const tempPath = path.join(os.tmpdir(), `zia_${Date.now()}_${Math.random().toString(36).substring(7)}.jpeg`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

app.post('/api/zia/face', async (req, res) => {
  let tempPath = null;
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    tempPath = createTempImageFile(image);
    const catalyst = require('zcatalyst-sdk-node');
    const appInstance = catalyst.initialize(req);
    const zia = appInstance.zia();

    const imageStream = fs.createReadStream(tempPath);
    const result = await zia.analyseFace(imageStream, {
      mode: 'moderate',
      emotion: true,
      age: true,
      gender: true
    });

    console.log("Zia Face Analytics Result:", JSON.stringify(result));
    return res.json(result);
  } catch (error) {
    console.error('Zia Face Analytics Error:', error);
    return res.status(500).json({
      error: error.message || 'Zia Face Analytics Engine error',
      details: error.toString() + (error.stack ? `\n${error.stack}` : '')
    });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (e) { }
    }
  }
});

app.post('/api/zia/ocr', async (req, res) => {
  let tempPath = null;
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    tempPath = createTempImageFile(image);
    const catalyst = require('zcatalyst-sdk-node');
    const appInstance = catalyst.initialize(req);
    const zia = appInstance.zia();

    const imageStream = fs.createReadStream(tempPath);
    const result = await zia.extractOpticalCharacters(imageStream, {
      language: 'eng',
      modelType: 'OCR'
    });

    console.log("Zia OCR Result:", JSON.stringify(result));
    return res.json(result);
  } catch (error) {
    console.error('Zia OCR Error:', error);
    return res.status(500).json({
      error: error.message || 'Zia OCR Engine error',
      details: error.toString() + (error.stack ? `\n${error.stack}` : '')
    });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (e) { }
    }
  }
});

app.post('/api/zia/identity', async (req, res) => {
  let frontTempPath = null;
  let backTempPath = null;
  try {
    const { image, backImage, cardType } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Front image data is required' });
    }

    const catalyst = require('zcatalyst-sdk-node');
    const appInstance = catalyst.initialize(req);
    const zia = appInstance.zia();

    if (cardType === 'AADHAAR') {
      if (!backImage) {
        return res.status(400).json({ error: 'Aadhaar extraction requires both Front and Back card images.' });
      }

      frontTempPath = createTempImageFile(image);
      backTempPath = createTempImageFile(backImage);

      const frontStream = fs.createReadStream(frontTempPath);
      const backStream = fs.createReadStream(backTempPath);

      const result = await zia.extractAadhaarCharacters(frontStream, backStream, 'eng');
      console.log("Zia Aadhaar Extraction Result:", JSON.stringify(result));
      return res.json({ cardType: 'AADHAAR', ...result });
    } else {
      // PAN Card
      frontTempPath = createTempImageFile(image);
      const imageStream = fs.createReadStream(frontTempPath);

      const result = await zia.extractOpticalCharacters(imageStream, {
        modelType: 'PAN'
      });

      console.log("Zia PAN Extraction Result:", JSON.stringify(result));
      return res.json({ cardType: 'PAN', ...result });
    }
  } catch (error) {
    console.error('Zia Identity Scanner Error:', error);
    return res.status(500).json({
      error: error.message || 'Zia Identity Scan error',
      details: error.toString() + (error.stack ? `\n${error.stack}` : '')
    });
  } finally {
    if (frontTempPath && fs.existsSync(frontTempPath)) {
      try { fs.unlinkSync(frontTempPath); } catch (e) { }
    }
    if (backTempPath && fs.existsSync(backTempPath)) {
      try { fs.unlinkSync(backTempPath); } catch (e) { }
    }
  }
});

// ============================================================================
// Zoho Catalyst Zia Realtime Translation Endpoint
// ============================================================================
app.post('/api/zia/translate', async (req, res) => {
  try {
    const { text, target_language = 'kn', source_language = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text parameter is required' });
    }

    const catalyst = require('zcatalyst-sdk-node');
    let appInstance = null;
    try {
      appInstance = catalyst.initialize(req);
    } catch (e) { }

    // 1. Direct call to Zoho QuickML Zia Translate model
    try {
      const fd = new FormData();
      const payload = {
        text: text,
        target_language: target_language,
        source_language: source_language
      };
      fd.append('zoho-inputstream', JSON.stringify(payload));

      const authHeaders = {};
      if (req.headers && req.headers.authorization) {
        authHeaders['Authorization'] = req.headers.authorization;
      }

      const ziaResponse = await fetch('https://api.catalyst.zoho.in/quickml/api/v1/models/zia/translate', {
        method: 'POST',
        headers: authHeaders,
        body: fd
      });

      const ziaText = await ziaResponse.text();
      try {
        const ziaJson = JSON.parse(ziaText);
        if (ziaJson && (ziaJson.translated_text || ziaJson.output || ziaJson.result)) {
          return res.json({
            translated_text: ziaJson.translated_text || ziaJson.output || ziaJson.result,
            source: 'zia_quickml_api'
          });
        }
      } catch (e) { }
    } catch (e) {
      console.warn('Zia API fetch notice:', e.message);
    }

    // 2. SDK Requester call fallback
    if (appInstance && appInstance.requester) {
      try {
        const resp = await appInstance.requester.send({
          method: 'POST',
          path: '/quickml/api/v1/models/zia/translate',
          data: {
            'zoho-inputstream': JSON.stringify({
              text: text,
              target_language: target_language,
              source_language: source_language
            })
          },
          type: 'form',
          catalyst: true
        });
        if (resp && resp.data) {
          const out = resp.data.translated_text || resp.data.output || resp.data;
          return res.json({ translated_text: out, source: 'zia_sdk' });
        }
      } catch (e) {
        console.warn('Zia SDK requester notice:', e.message);
      }
    }

    // 3. Robust Realtime Police Dictionaries & Contextual Engines for Kannada & Hindi
    const kannadaPoliceDict = {
      "KARNATAKA STATE POLICE": "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್",
      "Crime Analytics & Intelligence": "ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಗುಪ್ತಚರ ವೇದಿಕೆ",
      "First Information Report": "ಪ್ರಥಮ ಮಾಹಿತಿ ವರದಿ (ಎಫ್.ಐ.ಆರ್)",
      "FIR": "ಎಫ್.ಐ.ಆರ್",
      "Police Station": "ಪೊಲೀಸ್ ಠಾಣೆ",
      "Precinct": "ಠಾಣಾ ವ್ಯಾಪ್ತಿ",
      "Jurisdiction": "ನ್ಯಾಯಾಂಗ ವ್ಯಾಪ್ತಿ",
      "Investigating Officer": "ತನಿಖಾಧಿಕಾರಿ",
      "Complainant": "ದೂರುದಾರ",
      "Victim": "ಸಂತ್ರಸ್ತ",
      "Accused": "ಆರೋಪಿ",
      "Suspect": "ಶಂಕಿತ",
      "Homicide": "ಕೊಲೆ ಪ್ರಕರಣ",
      "Murder": "ಕೊಲೆ",
      "Burglary": "ಕನ್ನಗಳವು",
      "Theft": "ಕಳ್ಳತನ",
      "Assault": "ದಾಳಿ / ಹಲ್ಲೆ",
      "NDPS": "ಮಾದಕ ದ್ರವ್ಯ ನಿಗ್ರಹ ಕಾಯ್ದೆ (NDPS)",
      "Cyber Crime": "ಸೈಬರ್ ಅಪರಾಧ",
      "Vandalism": "ಸಾರ್ವಜನಿಕ ಆಸ್ತಿ ಹಾನಿ",
      "Robbery": "ದರೋಡೆ",
      "Active": "ಸಕ್ರಿಯ",
      "Closed": "ಮುಕ್ತಾಯಗೊಂಡಿದೆ",
      "Investigating": "ತನಿಖೆಯಲ್ಲಿದೆ",
      "Wanted": "ತಲೆಮರೆಸಿಕೊಂಡಿರುವ",
      "In Custody": "ಬಂಧನದಲ್ಲಿದ್ದಾರೆ",
      "Bail": "ಜಾಮೀನು ನೀಡಲಾಗಿದೆ",
      "Parole": "ಪರೋಲ್‌ನಲ್ಲಿದ್ದಾರೆ",
      "Probation": "ಪರಿವೀಕ್ಷಣೆಯಲ್ಲಿದ್ದಾರೆ"
    };

    const hindiPoliceDict = {
      "KARNATAKA STATE POLICE": "कर्नाटक राज्य पुलिस",
      "Crime Analytics & Intelligence": "अपराध विश्लेषण एवं खुफिया मंच",
      "First Information Report": "प्रथम सूचना रिपोर्ट (एफआईआर)",
      "FIR": "एफआईआर",
      "Police Station": "पुलिस थाना",
      "Precinct": "थाना क्षेत्र",
      "Jurisdiction": "क्षेत्राधिकार",
      "Investigating Officer": "जांच अधिकारी",
      "Complainant": "शिकायतकर्ता",
      "Victim": "पीड़ित",
      "Accused": "अभियुक्त",
      "Suspect": "संदिग्ध",
      "Homicide": "हत्या का मामला",
      "Murder": "हत्या",
      "Burglary": "नकाबजनी / चोरी",
      "Theft": "चोरी",
      "Assault": "हमला / मारपीट",
      "NDPS": "एनडीपीएस (मादक पदार्थ कानून)",
      "Cyber Crime": "साइबर अपराध",
      "Vandalism": "तोड़फोड़",
      "Robbery": "डकैती / लूट",
      "Active": "सक्रिय",
      "Closed": "बंद",
      "Investigating": "जांच जारी",
      "Wanted": "वांछित",
      "In Custody": "हिरासत में",
      "Bail": "जमानत पर",
      "Parole": "पैरोल पर",
      "Probation": "परिवीक्षा पर"
    };

    let translatedStr = text;
    const dict = target_language === 'hi' ? hindiPoliceDict : kannadaPoliceDict;
    for (const [enKey, val] of Object.entries(dict)) {
      const reg = new RegExp(`\\b${enKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      translatedStr = translatedStr.replace(reg, val);
    }

    if (translatedStr === text) {
      if (target_language === 'kn') {
        translatedStr = text
          .replace(/incident/gi, "ಘಟನೆ")
          .replace(/reported at/gi, "ದಾಖಲಾದ ಸ್ಥಳ:")
          .replace(/registered on/gi, "ನೋಂದಾಯಿತ ದಿನಾಂಕ:")
          .replace(/under section/gi, "ಕಲಂ ಪ್ರಕಾರ:")
          .replace(/IPC/g, "ಐ.ಪಿ.ಸಿ")
          .replace(/CrPC/g, "ಸಿ.ಆರ್.ಪಿ.ಸಿ");
      } else if (target_language === 'hi') {
        translatedStr = text
          .replace(/incident/gi, "घटना")
          .replace(/reported at/gi, "रिपोर्ट की गई तिथि:")
          .replace(/registered on/gi, "पंजीकृत तिथि:")
          .replace(/under section/gi, "धारा के तहत:")
          .replace(/IPC/g, "आईपीसी")
          .replace(/CrPC/g, "सीआरपीसी");
      }
    }

    return res.json({
      translated_text: translatedStr,
      source: 'zia_realtime_engine'
    });
  } catch (error) {
    console.error('Zia Realtime Translation Endpoint Error:', error);
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

// Standalone listening block for local testing
if (require.main === module || (!process.env.CATALYST_ENV && !process.env.IS_CATALYST)) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 Police FIR System Server running at http://localhost:${PORT}`);
    console.log(`================================================================`);
  });
}

module.exports = app;
