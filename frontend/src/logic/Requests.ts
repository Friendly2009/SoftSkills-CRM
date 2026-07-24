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
