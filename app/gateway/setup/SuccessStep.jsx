'use client';
import SetupShell, { PrimaryButton } from './SetupShell';

// Step 5 — shown after onFinish resolves. No stepper/back: setup is done.
export default function SuccessStep({
  title = 'Setup Complete',
  subtitle = 'This device is ready to accept payments.',
  actionLabel = 'Start Collecting',
  onStartCollecting,
  accent,
}) {
  return (
    <SetupShell
      steps={[]}
      title={title}
      subtitle={subtitle}
      accent={accent}
      footer={<PrimaryButton icon="arrow-right" onClick={onStartCollecting}>{actionLabel}</PrimaryButton>}
    >
      <div className="ds-success">
        <span className="ds-success-icon"><i className="fa fa-check" /></span>
      </div>
    </SetupShell>
  );
}
