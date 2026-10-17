// src/pages/Legal.jsx — Terms, Privacy and Refund policy.
// Payment providers (Safepay) require these pages to be public before approving a merchant.
// Review the wording with a lawyer before launch; update LAST_UPDATED when you change anything.
import React from 'react';
import { Link } from 'react-router-dom';

const LAST_UPDATED = 'October 17, 2026';
const CONTACT = 'aurelance454@gmail.com';

const Terms = () => (
  <>
    <p>These terms apply when you use Aurelance (“the service”). By creating an account you agree to them.</p>
    <h2>Your account</h2>
    <p>You need to give a real email address and keep your password private. You’re responsible for what happens under your account. You must be at least 18, or the age of majority where you live, to use Aurelance for business.</p>
    <h2>Your content</h2>
    <p>Everything you put into Aurelance — your profile, job posts, applications, contract deliveries, messages and files — stays yours. You give us permission to store and process it only so we can run the service for you. You can export or delete it at any time from Settings.</p>
    <h2>Working with other people</h2>
    <p>Aurelance is a place to find work, hire, and keep a signed record of what was agreed. Contracts on Aurelance are agreements between the client and the freelancer; Aurelance is not a party to them, does not hold money for either side, and does not take a fee from payments. Clients pay freelancers directly (for example by bank transfer, Payoneer or Wise) and record the payment on the contract.</p>
    <p>Report cards, response rates and reviews are calculated from activity on Aurelance and from what users write. Reviews are revealed only once both sides have written theirs or the review window has closed. We may remove reviews that are abusive, fake, or written to pressure someone.</p>
    <h2>Acceptable use</h2>
    <ul>
      <li>Don’t ask anyone to pay a fee to apply or start work, to share ID documents, OTP codes or banking passwords, or to move off Aurelance to avoid the record.</li>
      <li>Don’t post fake jobs, fake profiles, or reviews for work that didn’t happen.</li>
      <li>Don’t use Aurelance to send spam, harass people, or break the law.</li>
      <li>Don’t try to access other people’s accounts or data, or disrupt the service.</li>
      <li>Don’t resell the service without written permission.</li>
    </ul>
    <h2>Plans and payment</h2>
    <p>The Free plan costs nothing. Premium is prepaid for a month or a year through Safepay; prices are shown on the <Link to="/billing">pricing page</Link> before you pay. Premium does not renew automatically — when the paid period ends your account returns to Free and your data stays. Refunds are covered by the <Link to="/refunds">refund policy</Link>.</p>
    <h2>Availability</h2>
    <p>We work to keep Aurelance available and your data backed up, but the service is provided “as is”. We’re not liable for indirect losses, lost profits, or data you didn’t back up. Our total liability is limited to what you paid us in the 12 months before the claim.</p>
    <h2>Ending your account</h2>
    <p>You can delete your account at any time. We may suspend accounts that break these terms, after telling you why where we can.</p>
    <h2>Changes</h2>
    <p>If we change these terms in a way that matters, we’ll email you at least 14 days before the change applies.</p>
    <h2>Law</h2>
    <p>These terms are governed by the laws of Pakistan, with courts in Lahore having jurisdiction.</p>
  </>
);

const Privacy = () => (
  <>
    <p>This policy explains what Aurelance collects, why, and the choices you have.</p>
    <h2>What we collect</h2>
    <ul>
      <li><strong>Account details</strong> — name, email, password (stored as a one-way hash), and profile details you choose to add.</li>
      <li><strong>Your marketplace activity</strong> — job posts, applications, contracts and their milestones, payment records you enter, reviews, squads and connections.</li>
      <li><strong>Payout methods</strong> — bank, Payoneer or Wise details you add are encrypted with AES-256-GCM and shown only to you, and to a client on a contract you choose to share them on. For cards we store only the brand and last four digits. Proof documents for verification are deleted once reviewed.</li>
      <li><strong>Sign-in records</strong> — device type, browser and IP address for each signed-in session, so you can see and sign out devices.</li>
      <li><strong>Payments</strong> — the plan, amount, date and Safepay reference. Card and bank details are handled by Safepay; we never receive them.</li>
    </ul>
    <h2>How we use it</h2>
    <p>To run the service, keep your account secure, send the emails you’ve turned on (receipts, reminders, sign-in alerts), and answer support requests. We don’t sell your data or show ads.</p>
    <h2>Messages and the jobs board</h2>
    <p>Messages you send are stored so both people can read the conversation. Job posts are visible to every signed-in member; applications are visible only to you and the person who posted the job. You can block or report anyone from a conversation.</p>
    <h2>Identity verification</h2>
    <p>If you choose to verify your identity, the photos of your document and selfie are encrypted (AES-256) as soon as they reach us, viewed only by an Aurelance reviewer, and permanently deleted the moment a decision is made. We keep only the outcome, the document type and country, and the date.</p>
    <h2>AI features</h2>
    <p>When you use an AI feature, the numbers or text needed for that answer are sent to Anthropic to generate a response. They are not used to train models. Nothing is sent unless you press the button.</p>
    <h2>Who processes data for us</h2>
    <ul>
      <li>MongoDB Atlas — database hosting</li>
      <li>Vercel — application hosting</li>
      <li>Resend — transactional email</li>
      <li>Safepay — payments</li>
      <li>Anthropic — AI features you use</li>
      <li>Google and GitHub — only if you choose to sign in with them</li>
    </ul>
    <h2>Your choices</h2>
    <p>You can edit your profile, choose which emails you get, hide yourself from network search, export all your data, or delete your account — all from Settings. Deleting removes your workspace permanently; paid receipts are kept as required for tax records.</p>
    <h2>Contact</h2>
    <p>Privacy questions: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
  </>
);

const Refunds = () => (
  <>
    <p>Premium is prepaid and never renews automatically, so you’re never charged without choosing to pay.</p>
    <h2>First payment</h2>
    <p>If Premium isn’t right for you, ask for a full refund within <strong>7 days</strong> of your first payment.</p>
    <h2>Later payments</h2>
    <p>Payments after the first aren’t refundable, but you keep Premium until the end of the period you paid for.</p>
    <h2>Charged in error</h2>
    <p>If you were charged twice or for the wrong amount, we refund the difference in full.</p>
    <h2>How to ask</h2>
    <p>Send a ticket from Support, or email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> with your payment reference (it starts with AUR- and is on your receipt). Approved refunds go back to the original payment method through Safepay, usually within 5–10 business days depending on your bank.</p>
  </>
);

const DOCS = {
  terms: ['Terms of service', Terms],
  privacy: ['Privacy policy', Privacy],
  refunds: ['Refund policy', Refunds],
};

export default function Legal({ doc }) {
  const [title, Body] = DOCS[doc] || DOCS.terms;
  return (
    <article className="page-prose">
      <header className="ledger-title">
        <h1>{title}</h1>
        <p className="meta">Last updated {LAST_UPDATED}</p>
      </header>
      <Body />
    </article>
  );
}
