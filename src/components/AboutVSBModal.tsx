import React from 'react';
import { X, Building, Award, BookOpen, MapPin, Phone, Mail, Globe, Users, Bus, Home, CheckCircle2 } from 'lucide-react';
import { VSBLogo } from './VSBLogo';

interface AboutVSBModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutVSBModal({ isOpen, onClose }: AboutVSBModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <VSBLogo size="md" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">About VSB Engineering College</h3>
              <p className="text-xs text-slate-500">Karur, Tamil Nadu, India • Established in 2002</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
          {/* Official College Letterhead Banner */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white p-3 flex items-center justify-center shadow-xs">
            <img
              src="/vsb_college_logo.jpg"
              alt="V.S.B. Engineering College Official Banner"
              className="w-full max-h-24 object-contain"
            />
          </div>

          {/* Key Accreditations Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Counselling</span>
              <span className="text-base font-bold text-blue-600">TNEA 2622</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">NAAC Rating</span>
              <span className="text-base font-bold text-emerald-600">'A' Grade</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Affiliation</span>
              <span className="text-sm font-bold text-slate-900">Anna University</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Status</span>
              <span className="text-sm font-bold text-teal-700">Autonomous</span>
            </div>
          </div>

          {/* Overview */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              Institutional Heritage & Vision
            </h4>
            <p className="leading-relaxed text-slate-700">
              VSB Engineering College was established in the year 2002 under the aegis of V.S.B. Educational Trust, founded by the visionary philanthropist and educationalist <strong>Shri V.S. Balsamy</strong>. The college is an autonomous institution, approved by the All India Council for Technical Education (AICTE), New Delhi, and permanently affiliated to Anna University, Chennai.
            </p>
          </section>

          {/* Academic Departments */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              Programs Offered (Undergraduate B.E. / B.Tech)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'B.E. Computer Science and Engineering',
                'B.Tech Artificial Intelligence and Data Science',
                'B.Tech Artificial Intelligence & Machine Learning',
                'B.Tech Information Technology',
                'B.E. Electronics and Communication Engg.',
                'B.E. Electrical and Electronics Engg.',
                'B.E. Mechanical Engineering',
                'B.E. Biomedical Engineering',
                'B.E. Civil Engineering',
                'B.Tech Chemical Engineering',
              ].map((prog, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-800 font-medium">{prog}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Campus Highlights */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Infrastructure & Student Amenities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Central Library</span>
                <p className="text-[11px] text-slate-600">50,000+ volumes, IEEE digital access, DELNET, air-conditioned reading halls.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Transportation</span>
                <p className="text-[11px] text-slate-600">Fleet of 50+ college buses covering Karur, Trichy, Dindigul, Erode, and Namakkal.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-900 block mb-1">Hostels & Dining</span>
                <p className="text-[11px] text-slate-600">Separate modern hostels for men & women with Wi-Fi, 24/7 security, and hygienic multi-cuisine food.</p>
              </div>
            </div>
          </section>

          {/* Official Contact */}
          <section className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-semibold text-slate-900">Campus Contact & Location</h4>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>NH-67, Covai Road, Karudayampalayam Post, Karur - 639 111, Tamil Nadu, India.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>+91 4324 290141 / +91 4324 290142</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>admission@vsbec.com / info@vsbec.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>www.vsbec.com</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-xs"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
