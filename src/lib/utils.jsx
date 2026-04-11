import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};
const formatCurrency = formatPrice;
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};
const formatLocaleDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const copyToClipboard = async (text, label) => {
  try {
    await navigator.clipboard.writeText(text);
    toast(
      <div className="flex flex-col">
        <span className="font-medium text-green-600">
          {label} đã được sao chép.
        </span>
      </div>
    );
  } catch {
    toast(
      <div className="flex flex-col">
        <span className="font-medium text-red-600">
          Không thể sao chép {label}.
        </span>
      </div>
    );
  }
};
const getImagePreviewUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.readAsDataURL(file);
  });
};
const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
  if (file.size > maxSize) {
    return "File size must be less than 5MB";
  }
  if (!allowedTypes.includes(file.type)) {
    return "Only JPG, PNG, and GIF files are allowed";
  }
  return null;
};
const formatTime = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};
const formatDateTime = (dateStr) => {
  const date = formatDate(dateStr);
  const time = formatTime(dateStr);
  return `${date} ${time}`;
};

/**
 * Format relative time:
 * - If less than 24h: Show relative time (e.g., "2 giờ trước", "30 phút trước")
 * - If more than 24h: Show date in format dd/mm/yyyy h:m
 */
const formatRelativeTime = (isoString) => {
  if (!isoString) return "";
  
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // If less than 24 hours, show relative time
  if (diffHours < 24) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return "Vừa xong";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} phút trước`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} giờ trước`;
    }
  }
  
  // If more than 24 hours, show formatted date
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const allowedExtensions = [".jpeg", ".png", ".jpg", ".gif", ".bmp"];
const fileValidator = z.any().refine(
  (file) => {
    if (!file) return false;
    if (typeof file !== "object" || !("name" in file)) return false;
    const extension = file.name.toLowerCase().split(".").pop();
    return allowedExtensions.includes(`.${extension}`);
  },
  {
    message: "H\xECnh \u1EA3nh kh\xF4ng h\u1EE3p l\u1EC7 v\u1EDBi c\xE1c \u0111\u1ECBnh d\u1EA1ng: " + allowedExtensions.join(", ")
  }
);
export {
  cn,
  copyToClipboard,
  fileValidator,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatLocaleDate,
  formatPrice,
  formatRelativeTime,
  formatTime,
  getImagePreviewUrl,
  validateImageFile
};
