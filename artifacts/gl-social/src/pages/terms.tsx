import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 max-w-3xl mx-auto">
      <Link href="/">
        <button className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-sm text-white/40 mb-10">Last updated: July 4, 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-white/70 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using SameSky ("the Platform", "we", "us", "our"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Eligibility</h2>
          <p>You must be at least 13 years old to use SameSky. By using the Platform, you represent and warrant that you meet this requirement. If you are between 13 and 18 years old, you represent that a parent or legal guardian has reviewed and agreed to these Terms on your behalf.</p>
          <p className="mt-2">Certain content sections may be restricted to users 18 years of age or older. You agree not to misrepresent your age.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibent text-white mb-3">3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorised use of your account. We are not liable for losses caused by unauthorised use of your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. User Content</h2>
          <p>You retain ownership of content you submit to the Platform ("User Content"). By posting User Content, you grant SameSky a worldwide, non-exclusive, royalty-free licence to use, display, reproduce, and distribute that content on the Platform.</p>
          <p className="mt-2">You are solely responsible for your User Content. You represent and warrant that your User Content does not violate any third-party rights or applicable laws.</p>
          <p className="mt-2">We reserve the right to remove any User Content that violates these Terms or that we deem, in our sole discretion, to be harmful, offensive, or otherwise inappropriate.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Fan Content &amp; Third-Party Intellectual Property</h2>
          <p>SameSky is a fan community platform. Content relating to Thai GL series, shows, and artists belongs to their respective copyright holders. SameSky does not claim ownership of any intellectual property belonging to third-party studios, networks, or creators.</p>
          <p className="mt-2">Users must not upload content that infringes the intellectual property rights of third parties, including but not limited to full-length episodes, paid content, or watermarked promotional materials without authorisation from the rights holder.</p>
          <p className="mt-2">If you believe your copyrighted work has been posted on the Platform without authorisation, please contact us at: <span className="text-primary">legal@samesky.app</span></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Harass, bully, threaten, or intimidate other users</li>
            <li>Post content that is defamatory, obscene, discriminatory, or hateful</li>
            <li>Impersonate any person, entity, or actress</li>
            <li>Attempt to gain unauthorised access to any part of the Platform</li>
            <li>Use automated bots or scrapers without prior written permission</li>
            <li>Spam, manipulate, or artificially inflate engagement metrics</li>
            <li>Upload malware or malicious code</li>
            <li>Engage in or promote any illegal activity</li>
            <li>Exploit, abuse, or circumvent the Stars/virtual currency system</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Stars (Virtual Currency)</h2>
          <p>Stars are a virtual currency earned through community participation or granted by platform administrators. Stars have no monetary value, cannot be exchanged for real currency, and are non-transferable between accounts.</p>
          <p className="mt-2">Stars may be used to enter Community Drops (raffles) and unlock platform features. We reserve the right to adjust, cancel, or expire Stars balances at any time with reasonable notice.</p>
          <p className="mt-2">Any attempt to purchase, sell, or trade Stars outside the Platform is strictly prohibited and may result in account termination.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Community Drops &amp; Raffles</h2>
          <p>Community Drops are time-limited entry windows where users spend Stars for a chance to win prizes. Entry does not guarantee winning. Winners are selected randomly and have no right of appeal. We reserve the right to cancel or modify a Drop at any time.</p>
          <p className="mt-2">Community Drops are not lotteries under applicable law as no real monetary consideration is required to participate. Free-entry mechanisms are available where required by law.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
          <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for violations of these Terms or for any conduct we deem harmful to the Platform or its community.</p>
          <p className="mt-2">Upon termination, your right to use the Platform ceases immediately. Stars balances and User Content may be permanently deleted.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. Disclaimers</h2>
          <p>The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, SameSky shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">12. Governing Law</h2>
          <p>These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms shall be resolved through good-faith negotiation, and if unresolved, through binding arbitration or the courts of the applicable jurisdiction.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">13. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify users of material changes via the Platform. Continued use after notification constitutes acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">14. Contact</h2>
          <p>For questions about these Terms, contact us at: <span className="text-primary">legal@samesky.app</span></p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 flex gap-4 text-xs text-white/30">
        <Link href="/privacy"><span className="hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span></Link>
        <Link href="/"><span className="hover:text-white/60 cursor-pointer transition-colors">Back to SameSky</span></Link>
      </div>
    </div>
  );
}
