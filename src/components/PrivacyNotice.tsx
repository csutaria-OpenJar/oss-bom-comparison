interface PrivacyNoticeProps {
  variant: "header" | "upload" | "report";
}

export function PrivacyNotice({ variant }: PrivacyNoticeProps) {
  const text = {
    header: "Your BOM files stay in this browser. Nothing is uploaded to a server.",
    upload: "This file is parsed locally in your browser.",
    report: "Reports are generated locally. Refreshing or closing the tab clears the current comparison.",
  }[variant];

  return <p className="notice">{text}</p>;
}
