import { useState, createContext, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";

type NotificationType = "success" | "error" | "info" | "warning";

const NotificationContext = createContext<
  (message: string, type?: NotificationType) => void
>(() => {});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  let timeoutId: number;

  const showNotification = (
    text: string,
    notificationType: NotificationType = "info"
  ) => {
    setMessage(text);
    setType(notificationType);
    setVisible(true);
    clearTimeout(timeoutId);

    const wordCount = text.split(/\s+/).length;
    const duration = Math.min((wordCount / 2) * 1000, 20000); // 2 words per second

    timeoutId = setTimeout(() => setVisible(false), duration);
  };

  useEffect(() => {
    setVisible(false);
    clearTimeout(timeoutId);
  }, [location.pathname]);

  const getNotificationColor = () => {
    switch (type) {
      case "success":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      case "warning":
        return "bg-yellow-600";
      case "info":
        return "bg-blue-600";
      default:
        return "bg-gray-800";
    }
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      <div
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-xl text-white shadow-lg transition-all duration-500 z-50 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${getNotificationColor()}`}
      >
        {message}
      </div>
    </NotificationContext.Provider>
  );
};
