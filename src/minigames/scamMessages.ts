// Scam or Legit data + round factory. Generic senders only: no real bank, app or brand names.
// Every scam here is one Hyderabad students actually see (UPI collect, "OTP by mistake",
// task scams, fake KYC, lucky draws, fee-to-get-your-scholarship).
import { SortRound, drawBalanced, type SortItem } from './sortRound';

export type MessageKind = 'scam' | 'legit';

export interface PhoneMessage extends SortItem<MessageKind> {
  sender: string;
  text: string;
}

export const SCAM_TIME_MS = 60_000; // PLAYTEST-01 #15: 30 s was far too short for 8 messages
export const SCAM_ITEMS = 8;
/** ≥ 6 of 8 = win. */
export const SCAM_PASS = 6;

export const SCAM_POOL: readonly PhoneMessage[] = [
  {
    sender: 'UPI request',
    text: '"Prize Desk" requests ₹2,000. Enter your UPI PIN to RECEIVE your prize.',
    answer: 'scam',
    why: 'A PIN only ever SENDS money. Nobody needs it to pay you.',
  },
  {
    sender: '+91 98xxx xx210',
    text: 'Sorry, I sent my OTP to your number by mistake. Please forward it back quickly.',
    answer: 'scam',
    why: 'That OTP opens YOUR account. Never forward an OTP.',
  },
  {
    sender: 'Part-time job',
    text: 'Earn ₹5,000/day just liking videos! Pay ₹499 joining fee to start today.',
    answer: 'scam',
    why: 'Real jobs pay you. They never charge a joining fee.',
  },
  {
    sender: 'BANK-ALERT',
    text: 'Your KYC expires today! Click bit.ly/kyc-upd8 or your account will be blocked.',
    answer: 'scam',
    why: 'Panic + a short link = scam. Banks never block by SMS link.',
  },
  {
    sender: 'Lucky Draw',
    text: 'Congrats! You won a free phone. Pay ₹199 delivery charge to claim it now.',
    answer: 'scam',
    why: 'You never entered. "Free" that costs money is not free.',
  },
  {
    sender: 'Scholarship officer',
    text: 'Your allowance is approved. Pay ₹500 processing fee today or it lapses.',
    answer: 'scam',
    why: 'Real offices never ask you to pay to receive money.',
  },
  {
    sender: 'Your bank',
    text: '₹1,500 credited to A/c XX4821 on 10-Oct. Avl bal ₹3,240. No action needed.',
    answer: 'legit',
    why: 'Just information. No link, no PIN, no hurry.',
  },
  {
    sender: 'Scholarship portal',
    text: 'Application under verification. Track status only on the official website.',
    answer: 'legit',
    why: 'It sends you to the official site and asks for nothing.',
  },
  {
    sender: 'Your bank',
    text: 'OTP for login is 482913. Do NOT share it with anyone, even bank staff.',
    answer: 'legit',
    why: 'A real OTP SMS warns you not to share it.',
  },
  {
    sender: 'Amma',
    text: 'Bring 1 kg tomatoes on the way home. Money is on the table.',
    answer: 'legit',
    why: 'A saved contact, a normal ask, no money moving online.',
  },
  {
    sender: 'College office',
    text: 'Fee receipt No. 2231 for ₹1,200 paid at the counter. Keep it safe.',
    answer: 'legit',
    why: 'A receipt for something you did. Nothing to pay.',
  },
  {
    sender: 'Power dept',
    text: 'Electricity bill ₹640 due 15 Oct. Pay at the official app or counter.',
    answer: 'legit',
    why: 'Expected bill, official channels, no link to click.',
  },
];

export function newScamRound(
  random: () => number = Math.random,
): SortRound<MessageKind, PhoneMessage> {
  return new SortRound(drawBalanced(SCAM_POOL, SCAM_ITEMS, random), {
    timeLimitMs: SCAM_TIME_MS,
    passCount: SCAM_PASS,
  });
}
