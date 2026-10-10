import { ClientTemplate } from "../interfaces/clientsInterfaces.ts";

export const deleteClient = async (client: ClientTemplate): Promise<void> => {
  try {
    const response = await fetch(
      `https://api.soft-skills-crm.ru/delclients/${client.id}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    return;
  } catch (ex) {
    throw ex;
  }
};

export const topUpClient = async (clientId: number, amount: number): Promise<{ balance: number; transactionId: number }> => {
  const response = await fetch(`https://api.soft-skills-crm.ru/clients/${clientId}/top-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ amount }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Не удалось пополнить счёт (${response.status})`);
  }
  return data.data;
};

export const getClient = async () => {
  try {
    const response = await fetch(`https://api.soft-skills-crm.ru/getclient`, {
      credentials: "include",
    });

    if (response.status === 403) {
      return { status: 403 };
    }

    if (!response.ok) {
      throw new Error("oooops, something went wrong");
    }
    
    const data = await response.json();
    const rawClients = data.data || [];

    return rawClients.map((client: any) => ({
      ...client,
      next_visit: client.next_visit ? new Date(client.next_visit) : null
    }));
  } catch (ex) {
    console.error("Ошибка в getClient:", ex);
    throw ex;
  }
};


export const addClient = async (formData: ClientTemplate) => {
  try {
    const response = await fetch(`https://api.soft-skills-crm.ru/addclients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData), 
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Ошибка сервера: ${response.status}`);
    return data;
  } catch (ex) {
    throw ex;
  }
};

export const updateClient = async (updateFormData: ClientTemplate) => {
  try {
    const response = await fetch(
      `https://api.soft-skills-crm.ru/updateclient/${updateFormData.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          },
        credentials: "include",
        body: JSON.stringify(updateFormData), 
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Ошибка сервера: ${response.status}`);
    return data;
  } catch (ex) {
    throw ex;
  }
};
