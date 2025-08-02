import SubscriptionModal from "./subscription-modal";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditInfo?: {
    remainingCredits: number;
    isAtLimit: boolean;
  };
}

export default function UpgradeModal({ isOpen, onClose, creditInfo }: UpgradeModalProps) {
  return (
    <SubscriptionModal 
      isOpen={isOpen}
      onClose={onClose}
      showDiscountOffer={creditInfo?.isAtLimit}
      currentCredits={creditInfo?.remainingCredits || 0}
    />
  );
}