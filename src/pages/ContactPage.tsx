import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Building2,
  User,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Sparkles,
  Zap,
  HelpCircle,
  PhoneCall
} from "lucide-react";
import { Footer } from "../components/Footer";

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    volume: "10lakh_50lakh",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] font-sans flex flex-col justify-between selection:bg-[var(--color-accent)] selection:text-white transition-colors">
      {/* Top Header */}
      <header className="h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 flex items-center justify-between sticky top-0 z-30 shadow-premium-sm backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-premium-sm text-white">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
            <span>RevivePay</span>
            <span className="text-[var(--color-accent)] text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]">
              AI
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold text-[var(--color-text-secondary)]">
          <Link to="/" className="hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all font-semibold"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Draft regulatory banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
        <span>Draft for commercial & regulatory preview. Inquiries are routed to our product engineering team.</span>
      </div>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Context & Commitments */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] text-xs font-mono font-bold text-[var(--color-accent)]">
              <Mail className="w-3.5 h-3.5" />
              <span>Direct Support & Enterprise Inquiries</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Let's talk payment recovery.
            </h1>

            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Whether you need guidance configuring custom policy limits, exploring high-volume enterprise SLAs, or connecting your Razorpay sandbox, our engineering team responds directly.
            </p>

            <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <div className="p-2 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">SLA Commitment</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    We respond to all technical and sales inquiries within <strong className="text-[var(--color-text-primary)]">24 business hours</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Zero-Card Data Storage</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Card data is handled entirely by Razorpay. RevivePay never sees, stores, or handles raw card numbers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Direct Email</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">
                    <a href="mailto:support@revivepay.ai" className="text-[var(--color-accent)] hover:underline">
                      support@revivepay.ai
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-premium-md">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Inquiry Received
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-[var(--color-text-primary)]">{formData.name}</strong>. A technical lead will review your requirements and reach out to <strong className="text-[var(--color-text-primary)]">{formData.email}</strong> within 24 business hours.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", company: "", volume: "10lakh_50lakh", message: "" });
                      }}
                      className="px-4 py-2 rounded-md bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                      Send a Message
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Fill out this form or email us at support@revivepay.ai.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Priya Sharma"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="priya@company.in"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Apex Cloud Technologies"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                        Monthly Failed Volume (INR)
                      </label>
                      <select
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                      >
                        <option value="under_10lakh">Under ₹10 Lakhs / mo</option>
                        <option value="10lakh_50lakh">₹10 Lakhs - ₹50 Lakhs / mo</option>
                        <option value="50lakh_2crore">₹50 Lakhs - ₹2 Crores / mo</option>
                        <option value="above_2crore">Above ₹2 Crores / mo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                      Message / Integration Needs *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your payment flow, recurrence schedules, or specific recovery challenges..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-xs shadow-premium-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                    By submitting, you agree to our <Link to="/privacy" className="underline hover:text-[var(--color-text-secondary)]">Privacy Policy</Link>. We never share your contact details.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
