import {
  ApiError,
  apiFetch,
  errorMessage,
  notifyError,
} from "@/shared/api/client";
import { useMutationLock } from "@/shared/hooks/useMutationLock";
import { ILead } from "@/shared/types/LeadInterfaces";
import React, { useEffect, useState } from "react";
export function useLeads() {
  const { pending, run } = useMutationLock();

  const [error, setError] = useState("");
  const [leads, setLeads] = useState<ILead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isReSetMode, setIsReSetMode] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReSetModalWinOpen, setIsReSetModalWinOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [isForbiden, setIsForbiden] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    source: "",
    description: "",
  });

  const [resetFormData, setResetFormData] = useState({
    id: 0,
    name: "",
    contact: "",
    status: "new",
    source: "",
    loss_reason_id: "" as string | number,
    description: "",
  });

  const getLeads = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/get-lead`, {
        credentials: "include",
      });

      if (response.status === 403) {
        setIsForbiden(true);
        throw new Error("Access forbidden");
      }

      if (!response.ok) throw new Error("Something went wrong");

      const data = await response.json();
      setLeads(data.data || []);
    } catch (ex) {
      setError(errorMessage(ex));
      if (ex instanceof ApiError && ex.status === 403) setIsForbiden(true);
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLeads();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setResetFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch(`/create-lead`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
      setIsModalOpen(false);
      setFormData({ name: "", contact: "", source: "", description: "" });
      getLeads();
    } catch (error) {
      console.error(error);
      notifyError("Произошла ошибка при сохранении лида.");
    }
  };

  const handleResetFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetFormData.status === "lost" && !resetFormData.loss_reason_id) {
      notifyError("Пожалуйста, выберите причину отказа!");
      return;
    }

    try {
      const payload = {
        ...resetFormData,
        loss_reason_id:
          resetFormData.status === "lost"
            ? Number(resetFormData.loss_reason_id)
            : null,
      };

      const response = await apiFetch(`/update-lead/${resetFormData.id}`, {
        credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

      setIsReSetModalWinOpen(false);
      setIsReSetMode(false);
      getLeads();
    } catch (error) {
      console.error(error);
      notifyError("Произошла ошибка при обновлении данных лида.");
    }
  };

  const handleRowClick = async (lead: ILead) => {
    if (isDeleteMode) {
      if (
        !window.confirm(`Вы действительно хотите удалить лида ${lead.name}?`)
      ) {
        return;
      }

      try {
        const response = await apiFetch(`/delete-lead/${lead.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const result = await response.json();
        if (response.status === 403) {
          notifyError("У вас недостаточно прав для выполнения этого действия");
          throw new Error("Access forbidden");
        }
        if (response.ok && result.success) {
          setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        } else {
          notifyError(result.message || "Ошибка при удалении");
        }
      } catch (error) {
        console.error(error);
        notifyError("Не удалось выполнить удаление.");
      } finally {
        setIsDeleteMode(false);
      }
    }

    if (isReSetMode) {
      setIsDeleteMode(false);

      setResetFormData({
        id: lead.id,
        name: lead.name,
        contact: lead.contact,
        status: lead.status,
        source: lead.source || "",
        loss_reason_id: lead.loss_reason_id || "",
        description: lead.description || "",
      });

      setIsReSetModalWinOpen(true);
    }
  };

  const handlePlusClick = () => {
    setIsModalOpen(true);
  };
  const handleResetClick = () => {
    setIsDeleteMode(false);
    setIsReSetMode((prev) => !prev);
    setIsDeleteMode(false);
  };
  const handleDelClick = () => {
    setIsReSetMode(false);
    setIsDeleteMode((prev) => !prev);
    setIsReSetMode(false);
  };

  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "LD";
  };

  const translateStatus = (status: ILead["status"]) => {
    switch (status) {
      case "new":
        return "Новый";
      case "in_progress":
        return "В работе";
      case "trial_scheduled":
        return "Пробный назначен";
      case "trial_attended":
        return "Пробный посещен";
      case "won":
        return "Активен (Won)";
      case "lost":
        return "Проигран";
      default:
        return status;
    }
  };
  return {
    pending,
    error,
    setError,
    leads,
    loading,
    isDeleteMode,
    isReSetMode,
    setIsReSetMode,
    isModalOpen,
    setIsModalOpen,
    isReSetModalWinOpen,
    setIsReSetModalWinOpen,
    viewMode,
    setViewMode,
    isForbiden,
    formData,
    resetFormData,
    getLeads,
    handleInputChange,
    handleResetInputChange,
    handleSubmit: (e: React.FormEvent) => run(() => handleSubmit(e)),
    handleResetFormSubmit: (e: React.FormEvent) =>
      run(() => handleResetFormSubmit(e)),
    handleRowClick: (lead: ILead) => run(() => handleRowClick(lead)),
    handlePlusClick,
    handleResetClick,
    handleDelClick,
    getInitials,
    translateStatus,
  };
}
