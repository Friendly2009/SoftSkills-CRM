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
    return(data.data || [])
  } catch (ex) {
    console.error(ex);
  }
};
