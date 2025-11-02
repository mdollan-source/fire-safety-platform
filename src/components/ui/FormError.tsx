import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message: string;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-status-fail text-status-fail px-4 py-3 text-sm flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
