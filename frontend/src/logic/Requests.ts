import { ClientTemplate } from "../interfaces/clientsInterfaces.ts";
export const deleteClient = async (client: ClientTemplate) => {
  try {
    const response = await fetch(
      `http://localhost:3000/delclients/${client.id}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }
    console.log("User was deleted");
  } catch (ex) {
    console.error(ex);
  }
};

export const getClient = async () => {
  try {
    const response = await fetch("http://localhost:3000/getclient", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("oooops, something went wrong");
    }
    const data = await response.json();
    return data.data || [];
  } catch (ex) {
    console.error(ex);
  }
};

export const addClient = async (formData: ClientTemplate) => {
  try {
    const response = await fetch("http://localhost:3000/addclients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("something went wrong");
    }

    const data = await response.json();
    console.log(data);
  } catch (ex) {
    alert("Произошла ошибка при отправке данных");
    console.error(ex);
  }
};

export const updateClient = async (updateFormData: ClientTemplate) => {
  try {
    const response = await fetch(
      `http://localhost:3000/updateclient/${updateFormData.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateFormData),
      },
    );

    if (!response) {
      throw new Error("something went wrong");
    }
    const data = await response.json();
    console.log(data);
  } catch (ex) {
    console.log(ex);
    alert("something went wrong");
  }
};
