import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import App from "./App";
let authenticated: boolean;
let requests: string[];
const client = {
  id: 1,
  name: "Анна Иванова",
  contact: "+7",
  balance: -250,
  status: 1,
  skills: 0,
  group_ids: [1],
  group_names: ["Группа А"],
  next_visit: null,
};
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
beforeEach(() => {
  authenticated = true;
  requests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      const path = url.replace("/api", "");
      requests.push(path);
      let data: unknown = { success: true, data: [] },
        status = 200;
      if (path === "/getglobalinfo") {
        status = authenticated ? 200 : 401;
        data = {
          success: authenticated,
          data: authenticated
            ? {
                fullname: "Администратор",
                email: "test@example.test",
                rank: 1000,
              }
            : null,
        };
      } else if (path === "/getclient") data = { data: [client] };
      else if (path === "/getgroups")
        data = {
          data: [
            {
              id: 1,
              name: "Группа А",
              schedules: [],
              status: 1,
              max_students: 10,
            },
          ],
        };
      else if (path === "/getusers")
        data = {
          data: [
            {
              id: 1,
              full_name: "Преподаватель",
              rank: 100,
              role: "Преподаватель",
              email: "t@example.test",
              gender: "Жен",
            },
          ],
        };
      else if (path === "/get-lead")
        data = {
          data: [{ id: 1, name: "Лид А", status: "new", contact: "+7" }],
        };
      else if (path.startsWith("/schedule"))
        data = { success: true, data: { templates: [], realLessons: [] } };
      else if (path === "/logout") {
        authenticated = false;
        data = { success: true };
      } else if (path === "/signin") {
        status = 401;
        data = { success: false };
      } else if (path === "/finance/get-all-state")
        data = { success: true, revenue: 0, profit: 0, expense: 0, debt: 0 };
      else if (path === "/addclients" && options?.method === "POST") {
        status = 500;
        data = { success: false, message: "Сохранение отклонено" };
      }
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function open(path: string) {
  window.history.replaceState({}, "", path);
  render(<App />);
}
describe("CRM routes and forms", () => {
  it("returns from client profile to the list and keeps the route on remount", async () => {
    open("/dashboard/clients");
    fireEvent.click(await screen.findByRole("link", { name: "Анна Иванова" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "← Назад к списку" }),
    );
    await screen.findByRole("link", { name: "Анна Иванова" });
    expect(window.location.pathname).toBe("/dashboard/clients");
    cleanup();
    render(<App />);
    await screen.findByRole("link", { name: "Анна Иванова" });
    expect(window.location.pathname).toBe("/dashboard/clients");
  });
  it("does not report creation success or close a form after a server failure", async () => {
    open("/dashboard/clients");
    fireEvent.click(
      await screen.findByRole("button", { name: "Добавить клиента" }),
    );
    fireEvent.change(screen.getByLabelText("Имя"), {
      target: { value: "Новый клиент" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() =>
      expect(
        within(screen.getByRole("dialog")).getByRole("alert"),
      ).toHaveTextContent("Сохранение отклонено"),
    );
    expect(screen.getByLabelText("Имя")).toHaveValue("Новый клиент");
  });
  it("calls the logout API and redirects to login", async () => {
    open("/dashboard/clients");
    await screen.findByRole("link", { name: "Анна Иванова" });
    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
    await screen.findByRole("button", { name: "Войти" });
    expect(requests).toContain("/logout");
    expect(window.location.pathname).toBe("/authorization");
  });
  it("redirects an expired session and displays a rejected login", async () => {
    authenticated = false;
    open("/dashboard/clients");
    const submit = await screen.findByRole("button", { name: "Войти" });
    fireEvent.change(screen.getByLabelText("Название компании"), {
      target: { value: "Школа" },
    });
    fireEvent.change(screen.getByLabelText("Эл. почта"), {
      target: { value: "t@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Лицензионный ключ"), {
      target: { value: "badpassword" },
    });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0),
    );
    expect(window.location.pathname).toBe("/authorization");
  });
  it.each(["groups", "users", "leads"])(
    "opens the extracted %s creation dialog without runtime errors",
    async (route) => {
      open("/dashboard/" + route);
      fireEvent.click(await screen.findByRole("button", { name: /Добавить/ }));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Отмена",
        }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    },
  );
  it("renders a real empty schedule state", async () => {
    open("/dashboard/schedule");
    expect(
      await screen.findByText("На этой неделе занятий нет"),
    ).toBeInTheDocument();
  });
});
