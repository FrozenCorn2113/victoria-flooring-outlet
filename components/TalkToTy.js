// components/TalkToTy.js

export function TalkToTy() {
  return (
    <div className="mt-6 rounded-xl border border-[#D6D1C8] bg-white/95 p-5 md:p-6 shadow-sm">
      <p className="text-sm text-[#4A4237] leading-relaxed">
        <span className="font-medium text-[#1E1A15]">
          Not sure if this floor is right for your home?
        </span>{" "}
        Text Ty — he&apos;s flooring-obsessed and happy to help.
      </p>

      <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <a
          href="sms:7788717681"
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1E1A15] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
        >
          Text Ty now
        </a>

        <a
          href="tel:7788717681"
          className="inline-flex justify-center text-xs font-medium text-[#6B6458] hover:text-[#1E1A15] transition-colors"
        >
          or call: 778-871-7681
        </a>
      </div>

      <p className="mt-2 text-[11px] text-[#8A7F71]">
        Local Victoria support · Monday to Friday, 9-5.
      </p>
    </div>
  );
}
