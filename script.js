// To-Do List Application
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    initializeElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.clearAllBtn = document.getElementById('clearAll');
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmYes = document.getElementById('confirmYes');
        this.confirmNo = document.getElementById('confirmNo');
        this.confirmMessage = document.getElementById('confirmMessage');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
    }

    bindEvents() {
        // Add todo events
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Clear events
        this.clearCompletedBtn.addEventListener('click', () => {
            this.showConfirmModal('Bạn có chắc chắn muốn xóa tất cả công việc đã hoàn thành?', () => {
                this.clearCompleted();
            });
        });

        this.clearAllBtn.addEventListener('click', () => {
            this.showConfirmModal('Bạn có chắc chắn muốn xóa tất cả công việc?', () => {
                this.clearAll();
            });
        });

        // Modal events
        this.confirmNo.addEventListener('click', () => this.hideConfirmModal());
        this.confirmModal.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) this.hideConfirmModal();
        });

        // Input animation
        this.todoInput.addEventListener('focus', () => {
            this.todoInput.parentElement.style.transform = 'scale(1.02)';
        });

        this.todoInput.addEventListener('blur', () => {
            this.todoInput.parentElement.style.transform = 'scale(1)';
        });
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) {
            this.shakeInput();
            return;
        }

        if (this.editingId !== null) {
            this.updateTodo(this.editingId, text);
            this.editingId = null;
            this.addBtn.innerHTML = '<i class="fas fa-plus"></i>';
            this.todoInput.placeholder = 'Nhập công việc mới...';
        } else {
            const todo = {
                id: Date.now(),
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.todos.unshift(todo);
        }

        this.todoInput.value = '';
        this.saveTodos();
        this.render();
        this.updateStats();
        this.animateAdd();
    }

    updateTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            todo.updatedAt = new Date().toISOString();
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.updateStats();
            this.animateToggle(id);
        }
    }

    deleteTodo(id) {
        this.showConfirmModal('Bạn có chắc chắn muốn xóa công việc này?', () => {
            const todoElement = document.querySelector(`[data-id="${id}"]`);
            if (todoElement) {
                todoElement.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    this.todos = this.todos.filter(t => t.id !== id);
                    this.saveTodos();
                    this.render();
                    this.updateStats();
                }, 300);
            }
        });
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.todoInput.value = todo.text;
            this.todoInput.focus();
            this.editingId = id;
            this.addBtn.innerHTML = '<i class="fas fa-save"></i>';
            this.todoInput.placeholder = 'Chỉnh sửa công việc...';
            
            // Scroll to input
            this.todoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'pending':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    clearCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
        this.updateStats();
        this.hideConfirmModal();
    }

    clearAll() {
        this.todos = [];
        this.saveTodos();
        this.render();
        this.updateStats();
        this.hideConfirmModal();
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
            this.renderTodos(filteredTodos);
        }
    }

    renderTodos(todos) {
        this.todoList.innerHTML = todos.map(todo => this.createTodoHTML(todo)).join('');
        
        // Bind events for todo items
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            
            const checkbox = item.querySelector('.todo-checkbox');
            const editBtn = item.querySelector('.edit-btn');
            const deleteBtn = item.querySelector('.delete-btn');
            
            checkbox.addEventListener('change', () => this.toggleTodo(id));
            editBtn.addEventListener('click', () => this.editTodo(id));
            deleteBtn.addEventListener('click', () => this.deleteTodo(id));
        });
    }

    createTodoHTML(todo) {
        const createdDate = new Date(todo.createdAt).toLocaleDateString('vi-VN');
        const createdTime = new Date(todo.createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <small style="color: #999; font-size: 0.8rem;">
                            <i class="fas fa-calendar"></i> ${createdDate} 
                            <i class="fas fa-clock" style="margin-left: 10px;"></i> ${createdTime}
                        </small>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="todo-btn edit-btn" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="todo-btn delete-btn" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    showEmptyState() {
        this.emptyState.style.display = 'block';
        this.emptyState.style.animation = 'fadeIn 0.5s ease-out';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        this.animateNumber(this.totalTasksEl, total);
        this.animateNumber(this.pendingTasksEl, pending);
        this.animateNumber(this.completedTasksEl, completed);
        
        // Update button states
        this.clearCompletedBtn.disabled = completed === 0;
        this.clearAllBtn.disabled = total === 0;
    }

    animateNumber(element, newValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const increment = newValue > currentValue ? 1 : -1;
        const duration = 300;
        const steps = Math.abs(newValue - currentValue);
        const stepDuration = steps > 0 ? duration / steps : 0;
        
        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === newValue) {
                clearInterval(timer);
                element.style.animation = 'pulse 0.3s ease-out';
                setTimeout(() => {
                    element.style.animation = '';
                }, 300);
            }
        }, stepDuration);
    }

    showConfirmModal(message, onConfirm) {
        this.confirmMessage.textContent = message;
        this.confirmModal.classList.add('show');
        
        this.confirmYes.onclick = () => {
            onConfirm();
            this.hideConfirmModal();
        };
    }

    hideConfirmModal() {
        this.confirmModal.classList.remove('show');
    }

    shakeInput() {
        this.todoInput.style.animation = 'shake 0.5s ease-out';
        setTimeout(() => {
            this.todoInput.style.animation = '';
        }, 500);
    }

    animateAdd() {
        const firstItem = this.todoList.querySelector('.todo-item');
        if (firstItem) {
            firstItem.style.animation = 'slideInRight 0.5s ease-out';
        }
    }

    animateToggle(id) {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.style.animation = 'pulse 0.3s ease-out';
            setTimeout(() => {
                item.style.animation = '';
            }, 300);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
}

// Additional CSS animations
const additionalStyles = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes slideOutRight {
    from {
        opacity: 1;
        transform: translateX(0);
    }
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}

.todo-content {
    flex: 1;
    margin-left: 15px;
}

.todo-meta {
    margin-top: 5px;
}

.todo-item:hover .todo-meta {
    opacity: 1;
}

.todo-meta {
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
}

.action-btn:disabled:hover {
    transform: none !important;
    box-shadow: none !important;
}
`;

// Add additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
    
    // Add welcome animation
    setTimeout(() => {
        const container = document.querySelector('.container');
        container.style.animation = 'none';
    }, 1000);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to add todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            document.getElementById('addBtn').click();
        }
        
        // Escape to cancel editing
        if (e.key === 'Escape') {
            const todoInput = document.getElementById('todoInput');
            if (todoInput.value) {
                todoInput.value = '';
                todoInput.blur();
            }
        }
    });
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    console.log('🎉 To-Do List App đã được khởi tạo thành công!');
});