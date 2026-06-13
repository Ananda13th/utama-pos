import { useAppDispatch } from '../lib/hooks';
import { addToast, type ToastVariant } from '../features/ui/uiSlice';

// Hook praktis untuk memunculkan toast dari komponen mana pun
export function useToast() {
  const dispatch = useAppDispatch();
  return (message: string, variant: ToastVariant = 'info') => {
    dispatch(addToast(message, variant));
  };
}
