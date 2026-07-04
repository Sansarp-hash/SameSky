import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 max-w-3xl mx-auto">
      <Link href="/">
        <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-white/40 mb-10">Last updated: July 4, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-white/70 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Overview</h2>
          <p>SameSky ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our Platform.</p>
          <p className="mt-2">By using SameSky, you acknowledge that you have read and understood this Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
          <h3 className="text-base font-medium text-white/80 mb-2">Account Information</h3>
          <p>Authentication and account creation is handled by Clerk (clerk.com). When you sign up, Clerk collects your email address and password (or OAuth credentials if you sign in with a third party). We store a reference to your Clerk user ID and a display username in our database.</p>

          <h3 className="text-base font-medium text-white/80 mt-4 mb-2">Content You Post</h3>
          <p>We store content you submit to the Platform — posts, comments, ships, series lists, tarot readings, astrology profiles, and other user-generated content. This content is associated with your account.</p>

          <h3 className="text-base font-medium text-white/80 mt-4 mb-2">Usage Data</h3>
          <p>We collect server-side logs of API requests (HTTP method, URL path, response code, timestamp) for security and performance monitoring. These logs do not contain request body content. IP addresses may be temporarily logged by our infrastructure provider.</p>

          <h3 className="text-base font-medium text-white/80 mt-4 mb-2">Stars &amp; Transaction Data</h3>
          <p>We maintain a transaction log of all Stars (virtual currency) credits and debits associated with your account for auditing and dispute resolution.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide, operate, and improve the Platform</li>
            <li>To authenticate your identity via Clerk</li>
            <li>To display your content to other users as intended</li>
            <li>To administer Stars balances, raffles, and Community Drops</li>
            <li>To send in-app notifications about Platform activity</li>
            <li>To detect and prevent fraud, abuse, and security incidents</li>
            <li>To comply with applicable legal obligations</li>
          </ul>
          <p className="mt-3">We do not sell your personal data to third parties. We do not use your data for targeted advertising.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing</h2>
          <p>We share your data with the following third parties only as necessary to operate the Platform:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-white/80">Clerk (clerk.com)</strong> — Authentication and identity management. Clerk's privacy policy applies to data processed by Clerk.</li>
            <li><strong className="text-white/80">Replit</strong> — Hosting infrastructure. Replit's privacy policy applies to infrastructure-level data.</li>
            <li><strong className="text-white/80">Google Cloud Storage</strong> — File storage for user-uploaded content.</li>
          </ul>
          <p className="mt-3">We may disclose your information if required by law, court order, or governmental authority.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Cookies &amp; Local Storage</h2>
          <p>SameSky uses:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-white/80">Authentication cookies</strong> — Set by Clerk to maintain your login session. These are strictly necessary and cannot be disabled without losing access to the Platform.</li>
            <li><strong className="text-white/80">Local storage</strong> — Used for minor UI preferences (e.g. theme state). No personal data is stored.</li>
          </ul>
          <p className="mt-3">We do not use advertising, tracking, or analytics cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. If you delete your account, your profile, posts, and associated data are permanently deleted within 30 days, except where retention is required by law or legitimate business purposes (e.g. fraud investigation records).</p>
          <p className="mt-2">Stars transaction logs may be retained for up to 7 years for financial record-keeping purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-white/80">Access</strong> — Request a copy of your personal data</li>
            <li><strong className="text-white/80">Rectification</strong> — Correct inaccurate data</li>
            <li><strong className="text-white/80">Erasure</strong> — Request deletion of your data ("right to be forgotten")</li>
            <li><strong className="text-white/80">Portability</strong> — Receive your data in a structured, machine-readable format</li>
            <li><strong className="text-white/80">Objection</strong> — Object to certain processing of your data</li>
          </ul>
          <p className="mt-3">To exercise any of these rights, contact us at: <span className="text-primary">privacy@samesky.app</span></p>
          <p className="mt-2">We will respond within 30 days. We may need to verify your identity before processing your request.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Children's Privacy</h2>
          <p>SameSky is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, contact us immediately at <span className="text-primary">privacy@samesky.app</span> and we will delete it.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Security</h2>
          <p>We implement industry-standard security measures including HTTPS encryption, security headers, rate limiting, and authentication via Clerk. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.</p>
          <p className="mt-2">To report a security vulnerability, contact: <span className="text-primary">security@samesky.app</span></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. International Transfers</h2>
          <p>Your data may be processed in countries outside your own, including the United States, where our service providers are located. By using the Platform, you consent to this transfer. We ensure appropriate safeguards are in place for such transfers.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">11. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes via an in-app notification or email. Continued use of the Platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">12. Contact Us</h2>
          <p>For privacy-related questions or requests:</p>
          <p className="mt-2 text-primary">privacy@samesky.app</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 flex gap-4 text-xs text-white/30">
        <Link href="/terms"><span className="hover:text-white/60 cursor-pointer transition-colors">Terms of Service</span></Link>
        <Link href="/"><span className="hover:text-white/60 cursor-pointer transition-colors">Back to SameSky</span></Link>
      </div>
    </div>
  );
}
