"""CLI entry point for Todo Console App"""

from src.models import TaskNotFoundError, ValidationError
from src.operations import (
    add_task,
    delete_task,
    mark_complete,
    update_task,
    view_tasks,
)
from src.storage import TaskStorage


def display_menu() -> None:
    """Display the main menu options."""
    print("\n=== Todo App ===")
    print("1. Add Task")
    print("2. View Tasks")
    print("3. Mark Complete")
    print("4. Update Task")
    print("5. Delete Task")
    print("6. Exit")


def get_menu_choice() -> str:
    """Get user's menu choice.

    Returns:
        User's input as string
    """
    return input("\nEnter choice (1-6): ").strip()


def main() -> None:
    """Main application loop."""
    storage = TaskStorage()

    while True:
        display_menu()
        choice = get_menu_choice()

        if choice == "1":
            # Add Task
            description = input("Enter task description: ").strip()
            try:
                task = add_task(storage, description)
                print(f"Task added with ID: {task.id}")
            except ValidationError as e:
                print(f"Error: {e}")
        elif choice == "2":
            # View Tasks
            output = view_tasks(storage)
            print(output)
        elif choice == "3":
            # Mark Complete
            try:
                task_id_str = input("Enter task ID to mark complete: ").strip()
                task_id = int(task_id_str)
                mark_complete(storage, task_id)
                print(f"Task {task_id} marked as complete")
            except ValueError:
                print("Error: Invalid task ID. Please enter a number.")
            except TaskNotFoundError as e:
                print(f"Error: {e}")
        elif choice == "4":
            # Update Task
            try:
                task_id_str = input("Enter task ID to update: ").strip()
                task_id = int(task_id_str)
                new_description = input("Enter new description: ").strip()
                update_task(storage, task_id, new_description)
                print(f"Task {task_id} updated")
            except ValueError:
                print("Error: Invalid task ID. Please enter a number.")
            except (TaskNotFoundError, ValidationError) as e:
                print(f"Error: {e}")
        elif choice == "5":
            # Delete Task
            try:
                task_id_str = input("Enter task ID to delete: ").strip()
                task_id = int(task_id_str)
                delete_task(storage, task_id)
                print(f"Task {task_id} deleted")
            except ValueError:
                print("Error: Invalid task ID. Please enter a number.")
            except TaskNotFoundError as e:
                print(f"Error: {e}")
        elif choice == "6":
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Please enter a number between 1 and 6.")


if __name__ == "__main__":
    main()
