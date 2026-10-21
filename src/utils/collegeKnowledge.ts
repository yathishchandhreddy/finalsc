export interface CollegeDocumentChunk {
  documentId: string;
  documentName: string;
  content: string;
  index: number;
}

export interface CollegeDocumentRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  chunkCount: number;
  summary?: string;
  rawTextPreview?: string;
}

export const DEFAULT_VSB_DOCUMENTS: CollegeDocumentRecord[] = [
  {
    id: 'seed-vsb-overview',
    name: 'VSB_College_Official_Handbook_2025.txt',
    mimeType: 'text/plain',
    size: 4096,
    uploadedAt: '2025-01-01T00:00:00.000Z',
    chunkCount: 6,
    summary: 'Verified campus handbook: Autonomous status, NAAC A, TNEA Code 2622, Courses, Placements, Hostels, Transport, Sports.',
    rawTextPreview: 'VSB Engineering College, Karur: Autonomous Engineering College affiliated to Anna University, Chennai. NAAC A Grade accredited. TNEA Counselling Code: 2622...'
  }
];

export const DEFAULT_VSB_KNOWLEDGE: CollegeDocumentChunk[] = [
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 0,
    content: `VSB Engineering College, Karur Overview:
Institution Type: Autonomous Engineering College affiliated with Anna University, Chennai.
Approved by: All India Council for Technical Education (AICTE), New Delhi.
Accreditation: Accredited by NAAC with 'A' Grade, NBA accredited programs.
Founder: Shri V.S. Balsamy, Founder & Chairman of V.S.B. Educational Trust.
Establishment Year: Established in the year 2002.
Location: NH-67, Covai Road, Karudayampalayam Post, Karur - 639 111, Tamil Nadu, India.
Contact Numbers: +91 4324 290141, +91 4324 290142.
Email: admission@vsbec.com, info@vsbec.com.
Official Website: https://www.vsbec.com.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 1,
    content: `VSB Engineering College Admissions and Counselling:
TNEA Counselling Code: 2622 (Anna University Single Window System).
Eligibility for B.E. / B.Tech: Pass in 10+2 (HSC) or equivalent with Physics, Chemistry, and Mathematics as mandatory subjects.
Admission Quotas: Government Quota (through Anna University TNEA counselling code 2622) and Management Quota (merit-based direct admission).
Undergraduate Programs Offered (4 Years B.E. / B.Tech):
1. B.E. Computer Science and Engineering (CSE)
2. B.Tech Artificial Intelligence and Data Science (AI & DS)
3. B.Tech Artificial Intelligence and Machine Learning (AI & ML)
4. B.Tech Information Technology (IT)
5. B.E. Electronics and Communication Engineering (ECE)
6. B.E. Electrical and Electronics Engineering (EEE)
7. B.E. Mechanical Engineering (MECH)
8. B.E. Civil Engineering (CIVIL)
9. B.E. Biomedical Engineering (BME)
10. B.Tech Chemical Engineering
Postgraduate Programs (2 Years M.E.): M.E. Applied Electronics, M.E. Computer Science and Engineering.
Doctoral Programs (Ph.D.): Anna University recognized research departments in CSE, ECE, EEE, and Mechanical Engineering.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 2,
    content: `VSB Engineering College Placements & Career Guidance:
Placement Rate: Consistent 90%+ placement conversion among eligible students every academic year.
Highest Salary Package: Over ₹12+ Lakhs Per Annum (LPA).
Average Salary Package: ₹4.5 - ₹6.5 Lakhs Per Annum.
Top Recruiters: Tata Consultancy Services (TCS), Infosys, Cognizant (CTS), Wipro, Capgemini, Zoho Corporation, Hexaware Technologies, Virtusa, Mindtree, Tech Mahindra, HCL Technologies, DXC Technology, Kaar Technologies, Birlasoft, Quest Global, Accenture.
Training Cell: Value-added technical bootcamps in Full-stack Java, Python, Cloud computing, DSA, Mock Technical Interviews, and Aptitude training commencing from second year.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 3,
    content: `Campus Infrastructure & Facilities:
1. Central Library: Vast collection of over 50,000 volumes, international and national peer-reviewed journals, IEEE Xplore digital library access, DELNET, and air-conditioned digital learning centers.
2. Computing & Laboratories: High-speed 1 Gbps dedicated leased-line optical internet, modern computer centers with AI/GPU workstations, advanced robotics labs, IoT center, and smart interactive classrooms.
3. Residential Hostels: Separate, fully secured residential hostels for boys and girls inside the campus. Features include Wi-Fi connectivity, spacious study halls, RO purified water, 24/7 solar water heaters, 24/7 CCTV surveillance, and hygienic multi-cuisine dining hall.
4. Transport & College Bus Fleet: Fleet of 50+ college buses operating on comprehensive routes covering Karur, Tiruchirappalli (Trichy), Dindigul, Erode, Namakkal, Kulithalai, Musiri, Dharapuram, Vellakovil, and surrounding towns.
5. Sports & Fitness: International standard synthetic and clay courts for Basketball, Volleyball, Tennis, Badminton, 400m athletic track, football ground, cricket pitch with nets, and fully equipped gymnasiums.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 4,
    content: `Student Life, Clubs & Technical Symposiums:
Active Clubs: Coding Club, Robotics & IoT Club, AI Innovators, IEEE Student Branch, ISTE Student Chapter, SAE Collegiate Club, Rotaract Club, National Service Scheme (NSS), Youth Red Cross (YRC), and Cultural Club.
Flagship Annual Events: 'TECHNOVSB' (National Level Technical Symposium) featuring hackathons, paper presentations, project expos; and 'VSB FEST' (Annual Cultural Gala).`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 5,
    content: `Campus Administration & Location Details:
College Name: VSB Engineering College
Location: NH-67, Covai Road, Karudayampalayam Post, Karur - 639 111, Tamil Nadu.
Distance from Karur Bus Stand / Railway Station: Approximately 12 km (direct college buses and public transport available).
Office Hours: 8:30 AM to 5:00 PM (Monday to Saturday).
Admission Helpline: +91 4324 290141, +91 4324 290142, Email: admission@vsbec.com.`
  }
];

export function searchCollegeKnowledge(query: string, limit: number = 4): CollegeDocumentChunk[] {
  if (!query.trim() || DEFAULT_VSB_KNOWLEDGE.length === 0) return DEFAULT_VSB_KNOWLEDGE.slice(0, 2);

  const cleanQuery = query.toLowerCase();
  const terms = cleanQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = DEFAULT_VSB_KNOWLEDGE.map((chunk) => {
    const text = (chunk.content + ' ' + chunk.documentName).toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (text.includes(term)) {
        score += 3;
        const matches = text.split(term).length - 1;
        score += Math.min(matches, 4);
      }
    }

    // High intent domain matching
    if (cleanQuery.includes('tnea') && text.includes('tnea')) score += 10;
    if (cleanQuery.includes('counselling') && text.includes('counselling')) score += 8;
    if (cleanQuery.includes('code') && text.includes('2622')) score += 10;
    if (cleanQuery.includes('placement') && text.includes('placement')) score += 8;
    if (cleanQuery.includes('bus') && text.includes('bus')) score += 8;
    if (cleanQuery.includes('hostel') && text.includes('hostel')) score += 8;
    if (cleanQuery.includes('course') && (text.includes('b.e') || text.includes('b.tech'))) score += 8;
    if (cleanQuery.includes('admission') && text.includes('admission')) score += 8;
    if (cleanQuery.includes('contact') || cleanQuery.includes('phone') || cleanQuery.includes('email') || cleanQuery.includes('address')) {
      if (text.includes('contact') || text.includes('phone') || text.includes('location')) score += 8;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).map((s) => s.chunk);

  if (matched.length > 0) {
    return matched.slice(0, limit);
  }

  return DEFAULT_VSB_KNOWLEDGE.slice(0, limit);
}

export interface ClientCollegeResponse {
  answer: string;
  penguinState: 'greeting' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'error' | 'idle';
  sources: { documentName: string; relevanceScore: number }[];
}

export function generateClientCollegeResponse(
  userQuery: string,
  _history: any[] = []
): ClientCollegeResponse {
  const query = userQuery.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|vanakkam|namaste|good\s*(morning|afternoon|evening)|howdy|greetings|who\s*are\s*you)/i.test(query)) {
    return {
      answer: `Hello and welcome to VSB Engineering College! 🎓\n\nI am your official AI Campus Guide & 3D Tech Mascot. Here is how I can assist you with verified institutional details:\n\n• **TNEA Counselling Code: 2622** (Anna University Single Window System)\n• **Admissions & Degree Programs**: 10 B.E./B.Tech programs & M.E. programs\n• **Placements**: Consistent 90%+ record with top MNCs (TCS, Infosys, CTS, Zoho, Wipro)\n• **Campus Life**: Modern residential hostels, 50+ college bus routes, and high-tech labs\n\nWhat would you like to know about VSB Engineering College?`,
      penguinState: 'greeting',
      sources: [{ documentName: 'VSB_College_Official_Handbook_2025.txt', relevanceScore: 0.99 }]
    };
  }

  // TNEA counselling code specific query
  if (query.includes('tnea') || (query.includes('counselling') && query.includes('code')) || query.includes('code')) {
    return {
      answer: `**VSB Engineering College TNEA Counselling Information:**\n\n🏛️ **TNEA Counselling Code: 2622**\n• Affiliated to: Anna University, Chennai\n• Accreditation: NAAC 'A' Grade & NBA Accredited programs\n• Location: Karur, Tamil Nadu (NH-67 Covai Road)\n\nStudents applying through the Tamil Nadu Engineering Admissions (TNEA) single-window system should choose college code **2622**.\n\n📞 Admissions Helpline: +91 4324 290141 / 290142\n🌐 Official Website: https://www.vsbec.com`,
      penguinState: 'speaking',
      sources: [{ documentName: 'VSB_College_Official_Handbook_2025.txt', relevanceScore: 1.0 }]
    };
  }

  // Appreciation / Success
  if (/(thank\s*you|thanks|awesome|great|wonderful|got\s*admission|placed|congrats|super)/i.test(query)) {
    return {
      answer: `You're very welcome! We are always happy to help you with information about VSB Engineering College. Feel free to ask anything else about courses, admissions, campus amenities, or placements!`,
      penguinState: 'happy',
      sources: []
    };
  }

  // Search knowledge base
  const chunks = searchCollegeKnowledge(query, 3);
  if (chunks.length > 0) {
    const combined = chunks.map((c) => c.content.trim()).join('\n\n---\n\n');
    return {
      answer: `${combined}\n\n📍 **Direct Admission & College Inquiries:**\n• Phone: +91 4324 290141, +91 4324 290142\n• Email: admission@vsbec.com / info@vsbec.com\n• Website: https://www.vsbec.com`,
      penguinState: 'speaking',
      sources: [{ documentName: 'VSB_College_Official_Handbook_2025.txt', relevanceScore: 0.95 }]
    };
  }

  return {
    answer: `This specific inquiry is not covered in the current VSB Engineering College official records.\n\nPlease contact the administrative office directly for verified guidance:\n• Admission Cell: +91 4324 290141 / +91 4324 290142\n• Email: admission@vsbec.com / info@vsbec.com\n• Website: https://www.vsbec.com`,
    penguinState: 'error',
    sources: []
  };
}
