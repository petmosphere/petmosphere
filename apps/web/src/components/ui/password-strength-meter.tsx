const STRENGTH_META: Record<1 | 2 | 3 | 4, { color: string; label: string }> = {
  1: { color: "#EF4444", label: "Weak" },
  2: { color: "#F97316", label: "Fair" },
  3: { color: "#65BCB5", label: "Good" },
  4: { color: "#65BCB5", label: "Strong" },
};

export function passwordStrengthScore(pw: string): 1 | 2 | 3 | 4 {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, Math.max(1, s)) as 1 | 2 | 3 | 4;
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordStrengthScore(password);
  const { color, label } = STRENGTH_META[score];

  return (
    <div aria-live="polite" className="mt-3">
      <div className="flex gap-1">
        {([1, 2, 3, 4] as const).map((bar) => (
          <div
            key={bar}
            className="h-1 flex-1 rounded-sm transition-colors duration-300"
            style={{ backgroundColor: bar <= score ? color : "#EBE3D5" }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-xs font-medium text-[#8A8A8F]">
          Password strength
        </span>
        <span className="text-xs font-bold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
