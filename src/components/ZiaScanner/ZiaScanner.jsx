import React, { useState, useRef } from 'react';
import { 
  ScanFace, 
  FileText, 
  CreditCard, 
  UploadCloud, 
  Cpu, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  UserCheck,
  AlertTriangle
} from 'lucide-react';

const ziaTranslations = {
  en: {
    title: "AI Analysis & Verification Desk",
    desc: "Utilize deep learning cognitive models to accelerate incident reporting, document transcription, and biometric identification.",
    tabs: {
      face: "Face Recognition",
      ocr: "Document OCR Reader",
      id: "ID Card Verifier"
    },
    faceDesc: "Analyze facial attributes from crime scene photos or suspect mugshots to estimate age, gender, and emotional states.",
    ocrDesc: "Transcribe text from scanned paper complaints, FIR sheets, or evidence reports instantly.",
    idDesc: "Verify Aadhaar or PAN card documents to automatically extract and structure identity profiles.",
    uploadBtn: "Select File to Upload",
    dragDrop: "Drag & drop image file here or click to browse",
    runBtn: "Execute AI Verification",
    running: "AI Engine processing...",
    resultsTitle: "AI Inspection Output",
    age: "Estimated Age",
    gender: "Detected Gender",
    emotion: "Primary Emotion",
    smile: "Confidence Index",
    ocrResultTitle: "Extracted Text Content",
    idResultTitle: "Extracted Profile Information",
    idName: "Full Name",
    idDob: "Date of Birth",
    idNo: "ID Document Number",
    copySuccess: "Copied!",
    copyBtn: "Copy Text",
    cardSelect: "Select Document Type",
    runFaceSuccess: "Facial attributes processed.",
    runOcrSuccess: "Document transcription completed.",
    runIdSuccess: "Identity document parsed.",
    autoFillFirBtn: "Auto-Fill Extracted Details into FIR Registration"
  },
  hi: {
    title: "AI विश्लेषण एवं सत्यापन डेस्क",
    desc: "घटना रिपोर्टिंग, दस्तावेज ट्रांसक्रिप्शन और बायोमेट्रिक पहचान को तेज करने के लिए गहन शिक्षण संज्ञानात्मक मॉडल का उपयोग करें।",
    tabs: {
      face: "चेहरा पहचान",
      ocr: "दस्तावेज OCR रीडर",
      id: "पहचान पत्र सत्यापक"
    },
    faceDesc: "संदिग्धों की आयु, लिंग और भावनात्मक स्थिति का अनुमान लगाने के लिए अपराध स्थल की तस्वीरों का विश्लेषण करें।",
    ocrDesc: "स्कैन की गई शिकायतों, एफआईआर शीट्स या साक्ष्य रिपोर्ट से पाठ को तुरंत ट्रांसक्राइब करें।",
    idDesc: "प्रोफाइल जानकारी निकालने के लिए आधार या पैन कार्ड दस्तावेजों को स्वचालित रूप से सत्यापित करें।",
    uploadBtn: "अपलोड करने के लिए फ़ाइल चुनें",
    dragDrop: "यहाँ फ़ाइल खींचें और छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
    runBtn: "AI सत्यापन चलाएं",
    running: "AI इंजन संसाधित कर रहा है...",
    resultsTitle: "AI निरीक्षण आउटपुट",
    age: "अनुमानित आयु",
    gender: "पहचाना गया लिंग",
    emotion: "प्राथमिक भावना",
    smile: "विश्वास सूचकांक",
    ocrResultTitle: "निकाला गया पाठ सामग्री",
    idResultTitle: "निकाली गई प्रोफाइल जानकारी",
    idName: "पूरा नाम",
    idDob: "जन्म तिथि",
    idNo: "दस्तावेज संख्या",
    copySuccess: "कॉपी किया गया!",
    copyBtn: "पाठ कॉपी करें",
    cardSelect: "दस्तावेज प्रकार चुनें",
    runFaceSuccess: "चेहरे की विशेषताओं को संसाधित किया गया।",
    runOcrSuccess: "दस्तावेज ट्रांसक्रिप्शन पूरा हुआ।",
    runIdSuccess: "पहचान दस्तावेज का विश्लेषण किया गया।",
    autoFillFirBtn: "एफआईआर पंजीकरण फॉर्म में स्वचालित रूप से भरें"
  },
  kn: {
    title: "AI ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಪರಿಶೀಲನಾ ಡೆಸ್ಕ್",
    desc: "ಘಟನೆಯ ದಾಖಲಾತಿ, ದಸ್ತಾವೇಜು ಪಠ್ಯ ಪರಿವರ್ತನೆ ಮತ್ತು ಬಯೋಮೆಟ್ರಿಕ್ ಗುರುತಿಸುವಿಕೆಯನ್ನು ವೇಗಗೊಳಿಸಲು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮಾದರಿಗಳನ್ನು ಬಳಸಿ.",
    tabs: {
      face: "ಮುಖ ಗುರುತಿಸುವಿಕೆ",
      ocr: "ದಸ್ತಾವೇಜು ಪಠ್ಯ ಪರಿವರ್ತನೆ (OCR)",
      id: "ಗುರುತಿನ ಚೀಟಿ ಪರಿಶೀಲಕ"
    },
    faceDesc: "ಶಂಕಿತರ ವಯಸ್ಸು, ಲಿಂಗ ಮತ್ತು ಭಾವನಾತ್ಮಕ ಸ್ಥಿತಿಗಳನ್ನು ಅಂದಾಜು ಮಾಡಲು ಅಪರಾಧ ಸ್ಥಳದ ಫೋಟೋಗಳು ಅಥವಾ ಮಗ್‌ಶಾಟ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ.",
    ocrDesc: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ದೂರು ಪತ್ರಗಳು ಅಥವಾ ಎಫ್‌ಐಆರ್ ಹಾಳೆಗಳಿಂದ ಪಠ್ಯವನ್ನು ತಕ್ಷಣವೇ ಪರಿವರ್ತಿಸಿ.",
    idDesc: "ಗುರುತಿನ ವಿವರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪಡೆದುಕೊಳ್ಳಲು ಆಧಾರ್ ಅಥವಾ ಪಾನ್ ಕಾರ್ಡ್ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    uploadBtn: "ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ",
    dragDrop: "ಕಡತವನ್ನು ಇಲ್ಲಿಗೆ ಎಳೆಯಿರಿ ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
    runBtn: "AI ಪರಿಶೀಲನೆ ರನ್ ಮಾಡಿ",
    running: "AI ಎಂಜಿನ್ ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ...",
    resultsTitle: "AI ತಪಾಸಣೆಯ ಔಟ್‌ಪುಟ್",
    age: "ಅಂದಾಜು ವಯಸ್ಸು",
    gender: "ಕಂಡುಬಂದ ಲಿಂಗ",
    emotion: "ಮುಖ್ಯ ಭಾವನೆ",
    smile: "ವಿಶ್ವಾಸಾರ್ಹತೆ ಸೂಚ್ಯಂಕ",
    ocrResultTitle: "ಹೊರತೆಗೆಯಲಾದ ಪಠ್ಯ ಮಾಹಿತಿ",
    idResultTitle: "ಹೊರತೆಗೆಯಲಾದ ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ",
    idName: "ಪೂರ್ಣ ಹೆಸರು",
    idDob: "ಹುಟ್ಟಿದ ದಿನಾಂಕ",
    idNo: "ದಾಖಲೆ ಸಂಖ್ಯೆ",
    copySuccess: "ನಕಲಿಸಲಾಗಿದೆ!",
    copyBtn: "ಪಠ್ಯ ನಕಲಿಸಿ",
    cardSelect: "ದಾಖಲೆ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ",
    runFaceSuccess: "ಮುಖದ ಗುಣಲಕ್ಷಣಗಳನ್ನು ಸಂಸ್ಕರಿಸಲಾಗಿದೆ.",
    runOcrSuccess: "ದಸ್ತಾವೇಜು ಪಠ್ಯ ಪರಿವರ್ತನೆ ಪೂರ್ಣಗೊಂಡಿದೆ.",
    runIdSuccess: "ಗುರುತಿನ ದಾಖಲೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    autoFillFirBtn: "ಎಫ್‌ಐಆರ್ ನೋಂದಣಿ ನಮೂನೆಗೆ ಮಾಹಿತಿಯನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಭರ್ತಿ ಮಾಡಿ"
  }
};

export default function ZiaScanner({ lang = 'en', onAutoFillFIR, onAutoFillEvidence, onAutoFillOffender }) {
  const [activeTab, setActiveTab] = useState('face'); // 'face', 'ocr', 'id'
  const [cardType, setCardType] = useState('AADHAAR'); // 'AADHAAR' or 'PAN'
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [backImage, setBackImage] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  // AI Match Modal States
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedFields, setMatchedFields] = useState({
    complainantName: '',
    complainantAge: '',
    accusedNames: '',
    legalSections: '',
    briefFacts: ''
  });

  const fileInputRef = useRef(null);
  const backFileInputRef = useRef(null);
  const trans = ziaTranslations[lang] || ziaTranslations.en;

  const handleOpenMatchModal = () => {
    if (!results) return;

    let fields = {
      complainantName: '',
      complainantAge: '',
      accusedNames: '',
      legalSections: '',
      briefFacts: ''
    };

    if (activeTab === 'ocr') {
      const rawText = typeof results.text === 'string' ? results.text : (results.text_data ? results.text_data.map(t => t.text).join('\n') : '');
      fields.briefFacts = rawText;

      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

      // Complainant Name matching
      const nameLine = lines.find(l => /complainant|informant|duru|shikayat|name|ದೂರುದಾರ/i.test(l));
      if (nameLine) {
        fields.complainantName = nameLine.replace(/.*?(name|complainant|informant|duru|shikayat|ದೂರುದಾರ|ಹೆಸರು)[:\-\s]+/i, '').trim();
      } else if (lines.length > 0 && lines[0].length < 40 && !/police|station|district|court|fir/i.test(lines[0])) {
        fields.complainantName = lines[0];
      }

      // Age extraction
      const ageMatch = rawText.match(/(?:age|years|yrs|ವಯಸ್ಸು|आयु)[:\s]*(\d{1,3})/i) || rawText.match(/(\d{1,2})\s*(?:years|yrs|ವಯಸ್ಸು)/i);
      if (ageMatch && ageMatch[1]) {
        fields.complainantAge = ageMatch[1];
      }

      // Accused list extraction
      const accusedMatches = rawText.match(/(?:accused|a-\d|suspect|opposite party|ಆರೋಪಿ)[:\s]*([^\.\n]+)/gi);
      if (accusedMatches) {
        fields.accusedNames = accusedMatches.map(m => m.replace(/(?:accused|a-\d|suspect|opposite party|ಆರೋಪಿ)[:\s]*/gi, '').trim()).join(', ');
      }

      // Legal acts & sections extraction
      const secMatches = rawText.match(/(?:IPC|BNS|Sec|Section)\s*(\d{2,4}[A-Za-z]?)/gi);
      if (secMatches) {
        const secSet = new Set(secMatches.map(sm => sm.toUpperCase()));
        fields.legalSections = Array.from(secSet).join(', ');
      }
    } else if (activeTab === 'id') {
      let cleanData = results;
      if (results?.content?.text && typeof results.content.text === 'string') {
        try { cleanData = JSON.parse(results.content.text); } catch (e) {}
      } else if (typeof results?.text === 'string' && results.text.startsWith('{')) {
        try { cleanData = JSON.parse(results.text); } catch (e) {}
      }

      let nameVal = '';
      let dobVal = '';
      let idVal = '';
      let addrVal = '';

      if (cleanData && typeof cleanData === 'object') {
        Object.entries(cleanData).forEach(([k, item]) => {
          const keyLower = k.toLowerCase();
          const val = (item && typeof item === 'object' && item.value !== undefined) ? String(item.value) : String(item || '');
          if (keyLower.includes('name')) nameVal = val;
          else if (keyLower.includes('dob') || keyLower.includes('birth')) dobVal = val;
          else if (keyLower.includes('number') || keyLower.includes('no') || keyLower.includes('id') || keyLower.includes('aadhaar') || keyLower.includes('pan')) idVal = val;
          else if (keyLower.includes('address')) addrVal = val;
        });
      }

      fields.complainantName = nameVal;
      if (dobVal) {
        const year = dobVal.match(/\d{4}/);
        if (year) {
          const age = new Date().getFullYear() - parseInt(year[0]);
          if (age > 0 && age < 120) fields.complainantAge = String(age);
        }
      }
      fields.briefFacts = `Identity Verification (${results.cardType || cardType}). ID #: ${idVal}${addrVal ? `. Address: ${addrVal}` : ''}.`;
    }

    setMatchedFields(fields);
    setShowMatchModal(true);
  };

  const handleExecuteTargetFill = (target) => {
    setShowMatchModal(false);

    // Prepare payload
    const payload = {
      prefilledFromAI: true,
      ComplainantName: matchedFields.complainantName,
      ComplainantAge: matchedFields.complainantAge,
      BriefFacts: matchedFields.briefFacts,
      accusedList: matchedFields.accusedNames ? matchedFields.accusedNames.split(',').map(n => ({ name: n.trim(), age: '', genderId: 1 })).filter(a => a.name) : [],
      actsSections: matchedFields.legalSections ? matchedFields.legalSections.split(',').map(s => {
        const clean = s.trim();
        const act = clean.toUpperCase().includes('BNS') ? 'BNS' : 'IPC';
        const sec = clean.replace(/[^0-9A-Za-z]/g, '');
        return { actCode: act, sectionCode: sec };
      }).filter(s => s.sectionCode) : []
    };

    if (target === 'fir' && onAutoFillFIR) {
      onAutoFillFIR(payload);
    } else if (target === 'evidence' && onAutoFillEvidence) {
      onAutoFillEvidence(payload);
    } else if (target === 'offender' && onAutoFillOffender) {
      onAutoFillOffender(payload);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const processAndSetImage = async (file) => {
    if (!file) return;
    setImage(file);
    const compressed = await compressImage(file);
    if (compressed) {
      setImagePreview(compressed);
      setResults(null);
    }
  };

  const processAndSetBackImage = async (file) => {
    if (!file) return;
    setBackImage(file);
    const compressed = await compressImage(file);
    if (compressed) {
      setBackImagePreview(compressed);
      setResults(null);
    }
  };

  const resetAllImages = () => {
    setImage(null);
    setImagePreview('');
    setBackImage(null);
    setBackImagePreview('');
    setResults(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processAndSetImage(file);
    }
  };

  const handleBackFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processAndSetBackImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processAndSetImage(file);
    }
  };

  const handleBackDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processAndSetBackImage(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const runZiaAnalysis = async () => {
    if (!imagePreview) return;
    if (activeTab === 'id' && cardType === 'AADHAAR' && !backImagePreview) return;

    setLoading(true);
    setResults(null);

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Use proper base URL for backend API calls
    const baseUrl = isLocal ? 'http://localhost:3000' : '/server/police_fir_api';

    try {
      let endpoint = '/api/zia/face';
      let payload = { image: imagePreview };

      if (activeTab === 'ocr') {
        endpoint = '/api/zia/ocr';
      } else if (activeTab === 'id') {
        endpoint = '/api/zia/identity';
        payload.cardType = cardType;
        if (cardType === 'AADHAAR') {
          payload.backImage = backImagePreview;
        }
      }

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        data = { error: `Server returned HTTP ${response.status}`, details: rawText };
      }

      if (!response.ok) {
        setResults({ 
          error: data.error || `Zoho Zia AI processing failed (${response.status})`,
          details: data.details || rawText
        });
        return;
      }

      setResults(data);
    } catch (e) {
      console.error("Zia AI Error:", e);
      setResults({ error: e.message || "Failed to process image with Zoho Zia AI" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!results || !results.text) return;
    navigator.clipboard.writeText(results.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflow: 'hidden' }}>
      
      {/* Dynamic CSS for Scanning Lasers */}
      <style>{`
        @keyframes scan-laser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .scanner-glow-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          box-shadow: 0 0 12px var(--accent);
          animation: scan-laser 2.2s linear infinite;
          z-index: 10;
        }
      `}</style>

      {/* Header Info Panel */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Cognitive Assistant &amp; Verification Hub
        </span>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.1rem 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={20} style={{ color: 'var(--accent)' }} />
          {trans.title}
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
          {trans.desc}
        </p>

        {/* Cognitive Suite Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-deep)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: 'fit-content', marginTop: '1.25rem' }}>
          <button
            onClick={() => { setActiveTab('face'); resetAllImages(); }}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: 'none',
              background: activeTab === 'face' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'face' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'var(--t)'
            }}
          >
            <ScanFace size={13} />
            {trans.tabs.face}
          </button>
          <button
            onClick={() => { setActiveTab('ocr'); resetAllImages(); }}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: 'none',
              background: activeTab === 'ocr' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'ocr' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'var(--t)'
            }}
          >
            <FileText size={13} />
            {trans.tabs.ocr}
          </button>
          <button
            onClick={() => { setActiveTab('id'); resetAllImages(); }}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '2px',
              border: 'none',
              background: activeTab === 'id' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'id' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'var(--t)'
            }}
          >
            <CreditCard size={13} />
            {trans.tabs.id}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Workspace Left, Inspector Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* Workspace Card: Upload and Scan trigger */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {activeTab === 'face' && <ScanFace size={16} style={{ color: 'var(--accent)' }} />}
              {activeTab === 'ocr' && <FileText size={16} style={{ color: 'var(--accent)' }} />}
              {activeTab === 'id' && <CreditCard size={16} style={{ color: 'var(--accent)' }} />}
              {trans.tabs[activeTab]}
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              {activeTab === 'face' && trans.faceDesc}
              {activeTab === 'ocr' && trans.ocrDesc}
              {activeTab === 'id' && trans.idDesc}
            </p>
          </div>

          {/* Conditional Controls for Identity Card Type */}
          {activeTab === 'id' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{trans.cardSelect}:</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => { setCardType('AADHAAR'); resetAllImages(); }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: cardType === 'AADHAAR' ? 'var(--primary)' : 'var(--bg-elevated)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Aadhaar Card
                </button>
                <button
                  onClick={() => { setCardType('PAN'); resetAllImages(); }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: cardType === 'PAN' ? 'var(--primary)' : 'var(--bg-elevated)',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  PAN Card
                </button>
              </div>
            </div>
          )}

          {/* Image Upload Drag Area: Dual dropzone for Aadhaar, single dropzone for PAN/OCR/Face */}
          {activeTab === 'id' && cardType === 'AADHAAR' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: '200px' }}>
              
              {/* Front Side Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-inset)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '1rem',
                  boxSizing: 'border-box',
                  transition: 'var(--t)'
                }}
                className="hover-panel"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/jpg" 
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer', zIndex: 5 }} 
                />

                {imagePreview ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <img 
                      src={imagePreview} 
                      alt="Aadhaar Front" 
                      style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} 
                    />
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.4rem' }}>FRONT SIDE READY</span>
                    {loading && <div className="scanner-glow-line" />}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <UploadCloud size={24} style={{ color: 'var(--primary-light)' }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>Aadhaar Front Side</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click or Drag Front Photo</span>
                  </div>
                )}
              </div>

              {/* Back Side Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleBackDrop}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-inset)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '1rem',
                  boxSizing: 'border-box',
                  transition: 'var(--t)'
                }}
                className="hover-panel"
              >
                <input 
                  type="file" 
                  ref={backFileInputRef} 
                  onChange={handleBackFileChange} 
                  accept="image/png, image/jpeg, image/jpg" 
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer', zIndex: 5 }} 
                />

                {backImagePreview ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <img 
                      src={backImagePreview} 
                      alt="Aadhaar Back" 
                      style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} 
                    />
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.4rem' }}>BACK SIDE READY</span>
                    {loading && <div className="scanner-glow-line" />}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <UploadCloud size={24} style={{ color: 'var(--primary-light)' }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>Aadhaar Back Side</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Click or Drag Back Photo</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Single dropzone for PAN / OCR / Face */
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                flex: 1,
                minHeight: '220px',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-inset)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                padding: '1.5rem',
                boxSizing: 'border-box',
                transition: 'var(--t)'
              }}
              className="hover-panel"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/jpg" 
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer', zIndex: 5 }} 
              />

              {imagePreview ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <img 
                    src={imagePreview} 
                    alt="Pre-analysis Upload" 
                    style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} 
                  />
                  {loading && <div className="scanner-glow-line" />}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  <UploadCloud size={32} style={{ color: 'var(--primary-light)' }} />
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                      {trans.uploadBtn}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {trans.dragDrop}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trigger button */}
          <button
            disabled={!imagePreview || (activeTab === 'id' && cardType === 'AADHAAR' && !backImagePreview) || loading}
            onClick={runZiaAnalysis}
            style={{
              padding: '0.75rem',
              background: (!imagePreview || (activeTab === 'id' && cardType === 'AADHAAR' && !backImagePreview) || loading) ? 'var(--bg-elevated)' : 'var(--primary)',
              color: (!imagePreview || (activeTab === 'id' && cardType === 'AADHAAR' && !backImagePreview) || loading) ? 'var(--text-muted)' : '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: (!imagePreview || (activeTab === 'id' && cardType === 'AADHAAR' && !backImagePreview) || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--t)'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="spinner" />
                {trans.running}
              </>
            ) : (
              <>
                <Sparkles size={14} style={{ color: 'var(--accent)' }} />
                {trans.runBtn}
              </>
            )}
          </button>
        </div>

        {/* Inspector Panel Right: Outputs and extracted data */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', letterSpacing: '0.04em' }}>
            {trans.resultsTitle}
          </h3>

          {/* Fallback state when there are no results */}
          {!results && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', gap: '0.4rem', padding: '1.5rem' }}>
              <Cpu size={24} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: '0.75rem' }}>Ready for analysis. Upload a document or image to initiate cognitive AI processing.</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)', gap: '0.5rem' }}>
              <RefreshCw size={20} className="spinner" style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{trans.running}</span>
            </div>
          )}

          {/* Results Block */}
          {results && !loading && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* ERROR NOTIFICATION */}
              {results.error && (
                <div style={{ padding: '0.85rem', background: 'rgba(255, 68, 68, 0.08)', border: '1px solid var(--red)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--red)' }} />
                    <span>Zoho Zia AI Service Notification:</span>
                  </div>
                  <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-secondary)' }}>{results.error}</p>
                  {results.details && (
                    <pre style={{ margin: '0.5rem 0 0 0', fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                      {results.details}
                    </pre>
                  )}
                </div>
              )}
              
              {/* FACE ANALYTICS RESULTS */}
              {activeTab === 'face' && results.faces && results.faces.map((f, i) => {
                const agePrediction = typeof f.age === 'object' ? (f.age?.prediction || 'N/A') : (f.age || 'N/A');
                const genderPrediction = typeof f.gender === 'object' ? (f.gender?.prediction || 'N/A') : (f.gender || 'N/A');
                const emotionPrediction = typeof f.emotion === 'object' ? (f.emotion?.prediction || 'N/A') : (f.emotion || 'N/A');
                
                // Helper to format numeric confidence decimal (e.g. 0.85 -> 85%)
                const formatConf = (val) => {
                  if (val === undefined || val === null || val === '') return null;
                  const num = parseFloat(val);
                  if (isNaN(num)) return null;
                  return `${(num <= 1 ? num * 100 : num).toFixed(0)}%`;
                };

                const ageConf = f.age?.confidence && typeof f.age.confidence === 'object' 
                  ? formatConf(f.age.confidence[agePrediction] || Object.values(f.age.confidence)[0]) 
                  : null;

                const genderConf = f.gender?.confidence !== undefined ? formatConf(f.gender.confidence) : null;

                const emotionKey = emotionPrediction.toLowerCase().replace(' ', '_');
                const emotionConf = f.emotion?.confidence && typeof f.emotion.confidence === 'object'
                  ? formatConf(f.emotion.confidence[emotionKey] || f.emotion.confidence[emotionPrediction] || Object.values(f.emotion.confidence)[0])
                  : null;

                const faceDetectionScore = formatConf(f.confidence) || '100%';

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 700 }}>
                      <UserCheck size={14} />
                      {trans.runFaceSuccess} ({results.faces_count || results.faces.length} {lang === 'kn' ? 'ಮುಖಗಳು' : 'Face(s)'})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      
                      {/* ESTIMATED AGE */}
                      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{trans.age}</span>
                          {ageConf && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>{ageConf}</span>}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{agePrediction}</div>
                      </div>

                      {/* DETECTED GENDER */}
                      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{trans.gender}</span>
                          {genderConf && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>{genderConf}</span>}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{genderPrediction}</div>
                      </div>

                      {/* PRIMARY EMOTION */}
                      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{trans.emotion}</span>
                          {emotionConf && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>{emotionConf}</span>}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem', textTransform: 'capitalize' }}>{emotionPrediction}</div>
                      </div>

                      {/* FACE DETECTION SCORE */}
                      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {lang === 'kn' ? 'ಮುಖ ಪತ್ತೆ ಸೂಚ್ಯಂಕ' : 'FACE DETECTION SCORE'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{faceDetectionScore}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* OCR OPTICAL TEXT RESULTS */}
              {activeTab === 'ocr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 700 }}>
                    <Sparkles size={14} />
                    {trans.runOcrSuccess}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{trans.ocrResultTitle}</div>
                    <textarea
                      readOnly
                      value={typeof results.text === 'string' ? results.text : (results.text_data ? results.text_data.map(t => t.text).join('\n') : JSON.stringify(results, null, 2))}
                      style={{
                        flex: 1,
                        background: 'var(--bg-inset)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        resize: 'none',
                        outline: 'none',
                        lineHeight: 1.4
                      }}
                    />
                    <button
                      onClick={copyToClipboard}
                      style={{
                        padding: '0.45rem',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        alignSelf: 'flex-end',
                        transition: 'var(--t)'
                      }}
                      className="hover-panel"
                    >
                      {copied ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
                      {copied ? trans.copySuccess : trans.copyBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* IDENTITY CARD SCANNER RESULTS */}
              {activeTab === 'id' && (() => {
                let cleanData = results;
                if (results?.content?.text && typeof results.content.text === 'string') {
                  try {
                    cleanData = JSON.parse(results.content.text);
                  } catch (e) {
                    cleanData = results;
                  }
                } else if (typeof results?.text === 'string' && results.text.startsWith('{')) {
                  try {
                    cleanData = JSON.parse(results.text);
                  } catch (e) {}
                }

                // Collect valid field entries
                const entries = [];
                if (cleanData && typeof cleanData === 'object') {
                  Object.entries(cleanData).forEach(([key, item]) => {
                    if (['cardType', 'error', 'details', 'status', 'message', 'content'].includes(key)) return;
                    
                    let valStr = '';
                    let probStr = null;

                    if (item && typeof item === 'object' && item.value !== undefined) {
                      valStr = item.value !== null && item.value !== undefined ? String(item.value).trim() : '';
                      if (item.prob !== undefined && item.prob !== null) {
                        const num = parseFloat(item.prob);
                        if (!isNaN(num)) probStr = `${(num <= 1 ? num * 100 : num).toFixed(0)}%`;
                      }
                    } else if (typeof item === 'string' || typeof item === 'number') {
                      valStr = String(item).trim();
                    }

                    if (valStr !== '') {
                      entries.push({ key, value: valStr, prob: probStr });
                    }
                  });
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 700 }}>
                      <UserCheck size={14} />
                      {trans.runIdSuccess}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        {results.cardType || cardType} {trans.idResultTitle}
                      </div>
                      
                      {entries.length > 0 ? (
                        entries.map(({ key, value, prob }) => {
                          const formattedKey = key.replace(/_/g, ' ').toUpperCase();
                          const isIdNum = key.toLowerCase().includes('number') || key.toLowerCase().includes('no') || key.toLowerCase().includes('id') || key.toLowerCase().includes('aadhaar') || key.toLowerCase().includes('pan');
                          return (
                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{formattedKey}:</span>
                                {prob && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>({prob})</span>}
                              </div>
                              <strong style={{ color: isIdNum ? 'var(--accent)' : 'var(--text-primary)', fontFamily: isIdNum ? 'var(--font-mono)' : 'inherit', textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>
                                {value}
                              </strong>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'var(--font-mono)' }}>
                            {JSON.stringify(cleanData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Action Button: Review & Match Extracted Fields */}
              {(activeTab === 'ocr' || activeTab === 'id') && (
                <button
                  onClick={handleOpenMatchModal}
                  style={{
                    marginTop: '1.25rem',
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--ksp-blue))',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: 'var(--shadow)',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  className="hover-panel"
                >
                  <Cpu size={15} />
                  <span>{lang === 'kn' ? 'ಪಡೆದ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಹೊಂದಿಸಿ' : lang === 'hi' ? 'निकाली गई फ़ील्ड्स का मिलान करें' : 'Review & Match Extracted Fields'}</span>
                </button>
              )}

            </div>
          )}

        </div>
      </div>

      {/* AI FIELD MATCH & FORM ROUTING MODAL */}
      {showMatchModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1.5rem',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            margin: 'auto',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              width: '100%',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              boxSizing: 'border-box',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, paddingRight: '2.5rem' }}>
                <Cpu size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'kn' ? 'AI ಪಠ್ಯ ವಿಶ್ಲೇಷಣೆ & ಫೀಲ್ಡ್ ಮ್ಯಾಚಿಂಗ್ ಮಾದರಿ' : lang === 'hi' ? 'एआई निष्कर्षण और फ़ील्ड मिलान मॉडल' : 'AI Field Match & Form Extractor Model'}
                </h3>
              </div>
              <button
                onClick={() => setShowMatchModal(false)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'var(--t)'
                }}
                className="hover-panel"
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Editable Matched Fields */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {lang === 'kn' ? 'ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ ದಾಖಲೆಯಿಂದ ಕೆಳಗಿನ ಕ್ಷೇತ್ರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ. ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದರೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ:' : 'Extracted field values parsed from source document. Verify and edit matched fields before routing to target forms:'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complainant Name</label>
                  <input
                    type="text"
                    value={matchedFields.complainantName}
                    onChange={e => setMatchedFields(p => ({ ...p, complainantName: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.78rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complainant Age / DOB</label>
                  <input
                    type="text"
                    value={matchedFields.complainantAge}
                    onChange={e => setMatchedFields(p => ({ ...p, complainantAge: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.78rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Accused Suspect(s)</label>
                  <input
                    type="text"
                    value={matchedFields.accusedNames}
                    onChange={e => setMatchedFields(p => ({ ...p, accusedNames: e.target.value }))}
                    placeholder="e.g. Suresh Gowda, Ramesh"
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.78rem', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>IPC / BNS Legal Sections</label>
                  <input
                    type="text"
                    value={matchedFields.legalSections}
                    onChange={e => setMatchedFields(p => ({ ...p, legalSections: e.target.value }))}
                    placeholder="e.g. IPC 379, IPC 302"
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.78rem', marginTop: '0.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Brief Facts of Offence Narrative</label>
                <textarea
                  rows={4}
                  value={matchedFields.briefFacts}
                  onChange={e => setMatchedFields(p => ({ ...p, briefFacts: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.75rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Modal Footer: Target Form Buttons */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Target Form Destination to Auto-Fill:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <button
                  onClick={() => handleExecuteTargetFill('fir')}
                  style={{ padding: '0.65rem 0.5rem', background: 'linear-gradient(135deg, var(--primary), var(--ksp-blue))', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <FileText size={14} />
                  <span>FIR Registration</span>
                </button>

                <button
                  onClick={() => handleExecuteTargetFill('evidence')}
                  style={{ padding: '0.65rem 0.5rem', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  className="hover-panel"
                >
                  <UploadCloud size={14} />
                  <span>Evidence Registry</span>
                </button>

                <button
                  onClick={() => handleExecuteTargetFill('offender')}
                  style={{ padding: '0.65rem 0.5rem', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  className="hover-panel"
                >
                  <UserCheck size={14} />
                  <span>Offender Dossier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
