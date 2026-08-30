import { ChevronDown, Mail } from "lucide-react";

const faqs = [
  {
    answer:
      "If your account has no pets, open Profile and select Add your first pet. Enter the required name and species, add any optional details, then save. Your pet will appear on Home and in Profile.",
    question: "How do I add my first pet?",
  },
  {
    answer:
      "Choose how your pet seems today, then add any relevant descriptions, notes or photos. A check-in is a private observation record, not a diagnosis or confirmation that your pet is well. You can view, update or delete it from the Diary.",
    question: "How does the daily check-in work?",
  },
  {
    answer:
      "Open Reminders and select the plus button. Choose the pet, category, due date and time, and an optional repeat schedule. Reminders move to Overdue after their due time and can be completed with the checkbox.",
    question: "How do I set up reminders?",
  },
  {
    answer:
      "Use Log Weight from the Home weight tracker. Petmosphere keeps one weight entry per pet for each day; saving again on the same day updates that day’s entry. Weight records describe a trend only and do not provide veterinary advice.",
    question: "How do I track my pet’s weight?",
  },
  {
    answer:
      "Open Profile, then Notification Settings. Make sure All Notifications and the relevant reminder are enabled, and allow notifications in your browser or device settings. On iPhone and iPad, web push requires Petmosphere to be added to the Home Screen.",
    question: "Why am I not receiving notifications?",
  },
  {
    answer:
      "Your pet records are private and owner-scoped. Petmosphere uses access controls, Row Level Security and private media storage to help prevent unauthorised access. No online service is completely risk-free, so use a strong, unique password and contact us if you suspect account misuse.",
    question: "Is my pet’s data secure?",
  },
  {
    answer:
      "No. Petmosphere helps you organise observations and reminders, but it is not a veterinary clinic, emergency service or substitute for professional veterinary advice, diagnosis or treatment. Contact a veterinarian about health concerns and seek immediate veterinary help in an emergency.",
    question: "Does Petmosphere provide veterinary advice?",
  },
  {
    answer:
      "Open Profile, select Edit, then Delete Account. You will need to re-authenticate before permanent deletion. Save independent copies of anything you need first because this action cannot be undone.",
    question: "How do I delete my account?",
  },
];

export function FaqContent() {
  return (
    <div className="space-y-3">
      {faqs.map(({ answer, question }, index) => (
        <details
          className="group rounded-2xl border border-[#ead9c7] bg-white/60 px-4 shadow-[0_8px_24px_rgba(205,146,85,0.05)]"
          key={question}
          open={index === 0}
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 py-4 font-semibold marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] [&::-webkit-details-marker]:hidden">
            <span className="flex-1">{question}</span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-[#7a7a7a] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <p className="border-t border-[#efe4d7] pt-3 pb-5 text-sm leading-6 text-[#73706d]">
            {answer}
          </p>
        </details>
      ))}

      <div className="rounded-2xl bg-[#65bcb5]/10 p-4 text-sm leading-6 text-[#4f6664]">
        <p className="font-semibold text-[#2d2d2d]">Still need help?</p>
        <a
          className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-[#b05d1d] underline decoration-[#e6b082] underline-offset-4"
          href="mailto:info.petmosphere@gmail.com"
        >
          <Mail aria-hidden="true" className="size-4" />
          info.petmosphere@gmail.com
        </a>
      </div>
    </div>
  );
}
