import {
  ApiError,
  apiFetch,
  errorMessage,
  notifyError,
} from "@/shared/api/client";
import { useMutationLock } from "@/shared/hooks/useMutationLock";
import React, { useEffect, useState } from "react";
export interface UserTemplate {
  id: number;
  full_name: string;
  role: string;
  rank: number;
  email: string;
  birthday: Date | null;
  contact: string;
  gender: string | null;
}
export function useUsers() {
  const { pending, run } = useMutationLock();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<UserTemplate[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReSetModalWinOpen, setIsReSetModalWinOpen] = useState(false);
  const [isReSetMode, setIsReSetMode] = useState(false);
  const [isForbiden, setIsForbiden] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    role: "",
    rank: 100,
    email: "",
    contact: "",
    birthday: null as Date | null,
    gender: "Муж",
    password: "",
  });

  const [resetFormData, SetResetFormData] = useState({
    id: 0,
    full_name: "",
    role: "",
    rank: 100,
    email: "",
    contact: "",
    birthday: null as Date | null,
    gender: "Муж",
    password: "",
  });

  const getUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/getusers`, {
        credentials: "include",
      });

      if (response.status === 403) {
        setIsForbiden(true);
        return;
      }

      if (!response.ok) {
        throw new Error("oooops, something went wrong");
      }

      const data = await response.json();
      const rawUsers = data.data || [];

      const formattedUsers = rawUsers.map((user: any) => ({
        ...user,
        birthday: user.birthday ? new Date(user.birthday) : null,
      }));

      setUsers(formattedUsers);
    } catch (ex) {
      setError(errorMessage(ex));
      if (ex instanceof ApiError && ex.status === 403) setIsForbiden(true);
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "status"
          ? value === "true"
            ? 1
            : 0
          : name === "birthday"
            ? value
              ? new Date(value)
              : null
            : value,
    }));
  };

  const handleResetInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    SetResetFormData((prev) => ({
      ...prev,
      [name]:
        name === "status"
          ? value === "true"
            ? 1
            : 0
          : name === "birthday"
            ? value
              ? new Date(value)
              : null
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        birthday: formData.birthday
          ? formData.birthday.toISOString().split("T")[0]
          : null,
      };

      const response = await apiFetch(`/adduser`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 403) {
        notifyError("Ваших прав недостаточно для совершения этого действия");
        throw new Error("forbiden doing");
      }
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      setIsModalOpen(false);
      getUsers();
    } catch (error) {
      console.error("Не удалось отправить данные:", error);
      notifyError("Произошла ошибка при сохранении сотрудника.");
    }
  };

  const handleResetFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...resetFormData,
        birthday: resetFormData.birthday
          ? resetFormData.birthday.toISOString().split("T")[0]
          : null,
      };

      const response = await apiFetch(`/resetuser`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 403) {
        notifyError("Ваших прав недостаточно для совершения этого действия");
        throw new Error("forbiden doing");
      }
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      setIsReSetModalWinOpen(false);
      setIsReSetMode(false);
      getUsers();
    } catch (error) {
      console.error("Не удалось отправить данные:", error);
      notifyError("Произошла ошибка при сохранении сотрудника.");
    }
  };

  const handleRowClick = async (user: UserTemplate) => {
    if (isDeleteMode) {
      if (user.rank === 1000) {
        notifyError("Нельзя удалить сотрудника с рангом 1000 (Директор)!");
        return;
      }

      if (
        !window.confirm(
          `Вы действительно хотите удалить сотрудника ${user.full_name}?`,
        )
      ) {
        return;
      }

      try {
        const response = await apiFetch(`/deluser/${user.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
        } else {
          notifyError(result.message || "Ошибка при удалении");
        }
      } catch (error) {
        console.error("Ошибка при удалении пользователя:", error);
        notifyError("Не удалось выполнить удаление.");
      } finally {
        setIsDeleteMode(false);
      }
    }
    if (isReSetMode) {
      setIsDeleteMode(false);

      SetResetFormData({
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        rank: user.rank,
        email: user.email,
        contact: user.contact,
        birthday: user.birthday ? new Date(user.birthday) : null,
        gender: user.gender || "Муж",
        password: "",
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
  };

  const handleDelClick = () => {
    setIsReSetMode(false);
    setIsDeleteMode((prev) => !prev);
  };
  return {
    pending,
    loading,
    error,
    setError,
    users,
    isDeleteMode,
    isModalOpen,
    setIsModalOpen,
    isReSetModalWinOpen,
    setIsReSetModalWinOpen,
    isReSetMode,
    isForbiden,
    formData,
    resetFormData,
    getUsers,
    getInitials,
    handleInputChange,
    handleResetInputChange,
    handleSubmit: (e: React.FormEvent) => run(() => handleSubmit(e)),
    handleResetFormSubmit: (e: React.FormEvent) =>
      run(() => handleResetFormSubmit(e)),
    handleRowClick: (user: UserTemplate) => run(() => handleRowClick(user)),
    handlePlusClick,
    handleResetClick,
    handleDelClick,
  };
}
