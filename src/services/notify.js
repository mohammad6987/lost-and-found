import { toast } from "react-toastify";

const DEFAULT_OPTIONS = {
  position: "bottom-left",
  autoClose: 4000,
  pauseOnHover: true,
  closeOnClick: true,
  rtl: true,
  theme: "colored",
};

export function notifyError(message, options = {}) {
  if (!message) return;
  const safeMessage = String(message);
  const toastId = options.toastId ?? `error:${safeMessage}`;
  toast.error(safeMessage, { ...DEFAULT_OPTIONS, ...options, toastId });
}

export function notifySuccess(message, options = {}) {
  if (!message) return;
  const safeMessage = String(message);
  const toastId = options.toastId ?? `success:${safeMessage}`;
  toast.success(safeMessage, { ...DEFAULT_OPTIONS, ...options, toastId });
}

export function notifyWarn(message, options = {}) {
  if (!message) return;
  const safeMessage = String(message);
  const toastId = options.toastId ?? `warn:${safeMessage}`;
  toast.warn(safeMessage, { ...DEFAULT_OPTIONS, ...options, toastId });
}
