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
}
export interface ScheduleItem {
  day_of_week: string;
  start_time: string;
  end_time: string;
}
export interface GroupTemplate {
  id: number;
  name: string;
  users_id: number;
  status: number;
  schedules: ScheduleItem[];
  teacher?: string;
  studentsCount?: number;
  max_students: number;
  nextMeeting?: Date | null;
  start_date: Date | null;
  end_date?: Date | null;
  is_end_time: boolean;
}
export interface FormState {
  id: number;
  name: string;
  users_id: number;
  status: number;
  start_date: string;
  end_date: string;
  schedules: ScheduleItem[];
  max_students: number;
  is_end_time: boolean;
}
export const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
};
export function useGroups() {
  const { pending, run } = useMutationLock();

  const [error, setError] = useState("");
  const [groups, setGroups] = useState<GroupTemplate[]>([]);
  const [users, setUsers] = useState<UserTemplate[]>([]);
  const [isAddGroup, setIsAddGroup] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [isOpenModalWindow, setIsOpenModalWindow] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  const [formData, setFormData] = useState<FormState>({
    id: 0,
    name: "",
    users_id: 0,
    status: 1,
    max_students: 10,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    schedules: [{ day_of_week: "Понедельник", start_time: "", end_time: "" }],
    is_end_time: false,
  });
  const [updateFormData, setUpdateFormData] = useState<FormState>({
    id: 0,
    name: "",
    users_id: 0,
    status: 1,
    max_students: 10,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    schedules: [{ day_of_week: "Понедельник", start_time: "", end_time: "" }],
    is_end_time: false,
  });

  const handleDelGroup = () => {
    setIsUpdateMode(false);
    setIsDeleteMode((prev) => !prev);
  };
  const handleUpdateGroup = () => {
    setIsDeleteMode(false);
    setIsUpdateMode((prev) => !prev);
  };
  const handleUpdateInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({
      ...prev,
      [name]: name === "status" || name === "users_id" ? Number(value) : value,
    }));
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "status" || name === "users_id" ? Number(value) : value,
    }));
  };
  const handleScheduleChange = (
    index: number,
    field: keyof ScheduleItem,
    value: string,
  ) => {
    const updatedSchedules = [...formData.schedules];
    updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
    setFormData((prev) => ({ ...prev, schedules: updatedSchedules }));
  };
  const handleScheduleUpdateChange = (
    index: number,
    field: keyof ScheduleItem,
    value: string,
  ) => {
    setUpdateFormData((prev) => {
      const updatedSchedules = [...prev.schedules];
      updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
      return {
        ...prev,
        schedules: updatedSchedules,
      };
    });
  };
  const addScheduleField = () => {
    setFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { day_of_week: "Понедельник", start_time: "", end_time: "" },
      ],
    }));
  };

  const addUpdateScheduleField = () => {
    setUpdateFormData((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        { day_of_week: "Понедельник", start_time: "", end_time: "" },
      ],
    }));
  };
  const removeScheduleField = (index: number) => {
    if (formData.schedules.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };
  const removeUpdateScheduleField = (index: number) => {
    setUpdateFormData((prev) => {
      if (prev.schedules.length === 1) return prev;
      return {
        ...prev,
        schedules: prev.schedules.filter((_, i) => i !== index),
      };
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch(`/creategroup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          users_id: formData.users_id,
          status: formData.status,
          start_date: formData.start_date,
          end_date: hasEndDate ? formData.end_date : null,
          schedules: formData.schedules,
          max_students: formData.max_students,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при сохранении группы");
      }

      setIsAddGroup(false);
      setHasEndDate(false);
      setFormData({
        id: 0,
        name: "",
        users_id: 0,
        status: 1,
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        max_students: 10,
        schedules: [
          { day_of_week: "Понедельник", start_time: "", end_time: "" },
        ],
        is_end_time: false,
      });

      getGroup();
    } catch (ex) {
      setError(errorMessage(ex));
      if (ex instanceof ApiError && ex.status === 403) setIsForbidden(true);
      console.error(ex);
      notifyError("Не удалось сохранить группу");
    }
  };
  const getGroup = async () => {
    try {
      const response = await apiFetch(`/getgroups`, {
        credentials: "include",
      });

      if (response.status === 403) {
        setIsForbidden(true);
        return;
      }

      if (!response.ok) throw new Error("oooops, something went wrong");
      const rows = await response.json();
      const rawGroups = rows.data || [];

      const formattedGroups = rawGroups.map((group: any) => ({
        ...group,
        start_date: group.start_date ? new Date(group.start_date) : null,
        end_date: group.end_date ? new Date(group.end_date) : null,
        nextMeeting: group.nextMeeting ? new Date(group.nextMeeting) : null,
      }));

      setGroups(formattedGroups);
    } catch (ex) {
      setError(errorMessage(ex));
      if (ex instanceof ApiError && ex.status === 403) setIsForbidden(true);
      console.error(ex);
      notifyError("Не удалось загрузить группы");
    }
  };
  const getUsers = async () => {
    try {
      const response = await apiFetch(`/getusers`, {
        credentials: "include",
      });

      if (response.status === 403) {
        setIsReadOnly(true);
        return;
      }

      if (!response.ok) throw new Error("Ошибка при загрузке сотрудников");
      const rows = await response.json();
      setUsers(rows.data || []);
    } catch (ex) {
      setError(errorMessage(ex));
      if (ex instanceof ApiError && ex.status === 403) setIsForbidden(true);
      console.error(ex);
    }
  };
  const handleAddGroup = () => {
    setIsAddGroup(true);
  };
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < updateFormData.schedules.length; i++) {
      const item = updateFormData.schedules[i];

      if (
        item.start_time &&
        item.end_time &&
        item.start_time >= item.end_time
      ) {
        notifyError(
          `Ошибка в расписании (${item.day_of_week}): время начала занятия должно быть раньше времени окончания!`,
        );
        return;
      }
    }
    try {
      const { id, ...bodyData } = updateFormData;
      console.log("start updating group");

      const payload = {
        ...bodyData,
        end_date:
          !hasEndDate || bodyData.end_date === "" ? null : bodyData.end_date,
      };

      const response = await apiFetch(`/updategroup/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Не удалось обновить группу");
      setIsUpdateMode(false);
      getGroup();
      setIsOpenModalWindow(false);
    } catch (error) {
      console.error(error);
      notifyError("Ошибка обновления группы");
    }
  };
  const handleRowClick = async (group: GroupTemplate) => {
    if (isReadOnly) return;
    if (isDeleteMode) {
      if (
        !window.confirm(`Вы действительно хотите удалить группу ${group.name}?`)
      ) {
        return;
      }

      try {
        const response = await apiFetch(`/deletegroup/${group.id}`, {
          method: "DELETE",
          credentials: "include",
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setGroups((prev) => prev.filter((g) => g.id !== group.id));
        } else {
          notifyError(result.message || "Ошибка при удалении");
        }
      } catch (error) {
        console.error("Ошибка при удалении группы:", error);
        notifyError("Не удалось выполнить удаление.");
      } finally {
        setIsDeleteMode(false);
      }
    }

    if (isUpdateMode) {
      setIsDeleteMode(false);

      setUpdateFormData({
        id: group.id,
        name: group.name,
        users_id: group.users_id,
        status: group.status,
        max_students: group.max_students,
        start_date: group.start_date
          ? group.start_date.toISOString().split("T")[0]
          : "",
        end_date: group.end_date
          ? group.end_date.toISOString().split("T")[0]
          : "",
        schedules: group.schedules,
        is_end_time: !!group.end_date,
      });

      setHasEndDate(!!group.end_date);
      setIsOpenModalWindow(true);
    }
  };
  useEffect(() => {
    setIsLoading(true);
    Promise.all([getGroup(), getUsers()]).finally(() => {
      setIsLoading(false);
    });
  }, []);
  return {
    pending,
    error,
    setError,
    groups,
    users,
    isAddGroup,
    setIsAddGroup,
    isDeleteMode,
    isUpdateMode,
    hasEndDate,
    setHasEndDate,
    isOpenModalWindow,
    setIsOpenModalWindow,
    isLoading,
    isForbidden,
    isReadOnly,
    formData,
    setFormData,
    updateFormData,
    setUpdateFormData,
    handleDelGroup,
    handleUpdateGroup,
    handleUpdateInputChange,
    handleInputChange,
    handleScheduleChange,
    handleScheduleUpdateChange,
    addScheduleField,
    addUpdateScheduleField,
    removeScheduleField,
    removeUpdateScheduleField,
    handleSubmit: (e: React.FormEvent) => run(() => handleSubmit(e)),
    getGroup,
    handleAddGroup,
    handleUpdateSubmit: (e: React.FormEvent) =>
      run(() => handleUpdateSubmit(e)),
    handleRowClick: (group: GroupTemplate) => run(() => handleRowClick(group)),
  };
}
