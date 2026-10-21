export interface DocumentRecord {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  chunkCount: number;
  summary?: string;
  rawTextPreview?: string;
}

export interface DocumentChunk {
  documentId: string;
  documentName: string;
  content: string;
  index: number;
}

// Initial verified foundation knowledge for VSB Engineering College, Karur
export const DEFAULT_VSB_KNOWLEDGE: DocumentChunk[] = [
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 0,
    content: `VSB Engineering College, Karur:
Institution Type: Autonomous Engineering College affiliated to Anna University, Chennai.
Approved by: AICTE, New Delhi.
Accreditation: Accredited by NAAC with 'A' Grade, NBA accredited programs.
Founder: Shri V.S. Balsamy, Founder & Chairman of V.S.B. Educational Trust.
Establishment Year: Established in the year 2002.
Location: NH-67, Covai Road, Karudayampalayam Post, Karur - 639 111, Tamil Nadu, India.
Contact: Phone: +91 4324 290141, +91 4324 290142. Email: admission@vsbec.com, info@vsbec.com. Website: www.vsbec.com.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 1,
    content: `VSB Engineering College Admissions and Counselling:
TNEA Counselling Code: 2622 (Anna University Single Window System).
Programs Offered (Undergraduate - B.E. / B.Tech - 4 Years):
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
Postgraduate Programs (M.E. - 2 Years): M.E. Applied Electronics, M.E. Computer Science and Engineering.
Doctoral Research: Ph.D. research centers recognized by Anna University in CSE, ECE, EEE, and Mechanical Engineering.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 2,
    content: `VSB Engineering College Placements & Training:
Placement Track Record: Consistent 90%+ placement conversion among eligible students.
Top Recruiters: Tata Consultancy Services (TCS), Infosys, Cognizant (CTS), Wipro, Capgemini, Zoho Corporation, Hexaware Technologies, Virtusa, Mindtree, Tech Mahindra, HCL Technologies, DXC Technology, Kaar Technologies, Birlasoft.
Training Cell: Value-added courses, full-stack development bootcamps, aptitude training, soft skills, coding hackathons, and mock technical interviews starting from the second year.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 3,
    content: `Campus Infrastructure & Facilities:
1. Central Library: Vast collection of over 50,000 volumes of books, national and international journals, IEEE Xplore digital library access, DELNET, and air-conditioned reading halls.
2. Computing Facilities: High-speed optical fiber internet (1 Gbps leased line), modern computer centers with latest GPU workstations and open-source software stacks.
3. Hostels: Separate hygienic, secure residential hostels for boys and girls. Equipped with Wi-Fi, study halls, RO purified drinking water, 24/7 security & CCTV, and nutritional multi-cuisine dining.
4. Transport & College Buses: Extensive fleet of 50+ college buses operating across Karur, Tiruchirappalli (Trichy), Dindigul, Erode, Namakkal, Kulithalai, Musiri, Dharapuram, and Vellakovil.
5. Sports & Fitness: Synthetic and clay courts for Basketball, Volleyball, Tennis, Badminton, standard 400m athletic track, football ground, cricket nets, and modern gymnasium.`
  },
  {
    documentId: 'seed-vsb-overview',
    documentName: 'VSB_College_Official_Handbook_2025.txt',
    index: 4,
    content: `Student Clubs & Extracurricular Activities:
Clubs: Coding Club, Robotics & IoT Club, AI Innovators, IEEE Student Branch, ISTE Chapter, SAE Collegiate Club, Rotaract Club, NSS, YRC, and Cultural Club.
Annual Events: 'TECHNOVSB' (National Level Technical Symposium), 'VSB FEST' (Annual Cultural Gala), and Sports Day.
Industry Collaboration: MoUs with leading technology companies, Centers of Excellence in Cloud Computing, AI/Data Science, and Embedded Systems.`
  }
];
