document.addEventListener("DOMContentLoaded", () => {
  const todoList = document.getElementById("todo-list")
  const newTodoInput = document.getElementById("new-todo-input")
  const addTodoBtn = document.getElementById("add-todo-btn")
  const loadingEl = document.getElementById("loading")
  const emptyStateEl = document.getElementById("empty-state")
  const editModal = document.getElementById("edit-modal")
  const editTextInput = document.getElementById("edit-text")
  const editCompletedCheckbox = document.getElementById("edit-completed")
  const cancelEditBtn = document.getElementById("cancel-edit-btn")
  const saveEditBtn = document.getElementById("save-edit-btn")
  const toastContainer = document.getElementById("toast-container")

  let todos = []
  let currentEditTodoId = null

  const API_BASE_URL = "http://localhost:8000"

  init()

  function init() {
    addTodoBtn.addEventListener("click", handleAddTodo)
    newTodoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleAddTodo()
    })
    cancelEditBtn.addEventListener("click", closeEditModal)
    saveEditBtn.addEventListener("click", handleSaveEdit)

    fetchTodos()
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.innerHTML = `<span class="toast-text">${message}</span>`
    toastContainer.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  async function fetchTodos() {
    try {
      showLoading(true)
      const response = await fetch(`${API_BASE_URL}/get_all_todo`)

      if (!response.ok) {
        throw new Error("Failed to fetch todos")
      }

      todos = await response.json()
      renderTodos()
    } catch (error) {
      console.error("Error fetching todos:", error)
      showToast("Failed to load todos. Please try again.", "error")
    } finally {
      showLoading(false)
    }
  }

  async function createTodo(text) {
    try {
      addTodoBtn.disabled = true

      const response = await fetch(`${API_BASE_URL}/create_todo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to create todo")
      }

      const newTodo = await response.json()
      todos.push(newTodo)
      renderTodos()
      newTodoInput.value = ""
      showToast("Todo created successfully!")
    } catch (error) {
      console.error("Error creating todo:", error)
      showToast("Failed to create todo. Please try again.", "error")
    } finally {
      addTodoBtn.disabled = false
    }
  }

  async function updateTodo(id, updates) {
    try {
      saveEditBtn.disabled = true

      const response = await fetch(`${API_BASE_URL}/update_todo:id?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update todo")
      }

      const updatedTodo = await response.json()

      todos = todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
      renderTodos()
      closeEditModal()
      showToast("Todo updated successfully!")
    } catch (error) {
      console.error("Error updating todo:", error)
      showToast("Failed to update todo. Please try again.", "error")
    } finally {
      saveEditBtn.disabled = false
    }
  }

  async function deleteTodo(id) {
    try {
      const todoToDelete = todos.find((todo) => todo.id === id)
      if (!todoToDelete) return

      const response = await fetch(`${API_BASE_URL}/delete_todo:id?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: todoToDelete.text }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete todo")
      }

      todos = todos.filter((todo) => todo.id !== id)
      renderTodos()
      showToast("Todo deleted successfully!")
    } catch (error) {
      console.error("Error deleting todo:", error)
      showToast("Failed to delete todo. Please try again.", "error")
    }
  }

  async function toggleTodoStatus(id, completed) {
    try {
      const response = await fetch(`${API_BASE_URL}/update_todo:id?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !completed }),
      })

      if (!response.ok) {
        throw new Error("Failed to update todo status")
      }

      const updatedTodo = await response.json()

      todos = todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
      renderTodos()
    } catch (error) {
      console.error("Error updating todo status:", error)
      showToast("Failed to update todo status. Please try again.", "error")
    }
  }

  function renderTodos() {
    todoList.innerHTML = ""

    if (todos.length === 0) {
      emptyStateEl.classList.remove("hidden")
      return
    }

    emptyStateEl.classList.add("hidden")

    todos.forEach((todo) => {
      const li = document.createElement("li")
      li.className = `todo-item ${todo.completed ? "completed" : ""}`

      const createDate = new Date(todo.create_at)
      const formattedDate =
        createDate.toLocaleDateString() +
        " at " +
        createDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      li.innerHTML = `
        <label class="todo-checkbox-label">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""}>
          <div>
            <div class="todo-text">${escapeHtml(todo.text)}</div>
            <div class="todo-date">Created: ${formattedDate}</div>
          </div>
        </label>
        <div class="todo-actions">
          <button class="btn-icon btn-edit" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button class="btn-icon btn-delete" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      `

      const checkbox = li.querySelector(".todo-checkbox")
      checkbox.addEventListener("change", () => toggleTodoStatus(todo.id, todo.completed))

      const editBtn = li.querySelector(".btn-edit")
      editBtn.addEventListener("click", () => openEditModal(todo))

      const deleteBtn = li.querySelector(".btn-delete")
      deleteBtn.addEventListener("click", () => deleteTodo(todo.id))

      todoList.appendChild(li)
    })
  }

  function handleAddTodo() {
    const text = newTodoInput.value.trim()
    if (text) {
      createTodo(text)
    }
  }

  function openEditModal(todo) {
    currentEditTodoId = todo.id
    editTextInput.value = todo.text
    editCompletedCheckbox.checked = todo.completed
    editModal.classList.remove("hidden")
  }

  function closeEditModal() {
    editModal.classList.add("hidden")
    currentEditTodoId = null
  }

  function handleSaveEdit() {
    if (currentEditTodoId === null) return

    const updates = {
      text: editTextInput.value.trim(),
      completed: editCompletedCheckbox.checked,
    }

    updateTodo(currentEditTodoId, updates)
  }

  function showLoading(show) {
    if (show) {
      loadingEl.classList.remove("hidden")
    } else {
      loadingEl.classList.add("hidden")
    }
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, "\"")
      .replace(/'/g, "&#039;")
  }
})
