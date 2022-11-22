import {useEffect, useState} from 'react';
import apiService from '../services/apiService';
import {Alert, Card, CardContent, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import AddIcon from '@material-ui/icons/Add';
import IconButton from "@mui/material/IconButton";

/**
 * Tasks component.
 */
function Tasks() {
    const [taskLists, setTaskLists] = useState([]);

    const [alert, setAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        console.log("Fetching task lists");

        /**
         * Fetches the task lists.
         */
        async function getTaskLists() {
            const taskLists = await apiService.getTaskLists();

            for (const taskList of taskLists) {
                taskList.tasks = await apiService.getTasks(taskList.id);
            }

            setTaskLists(taskLists);
        }

        getTaskLists();
    }, []);

    /**
     * Adds a task to the task list.
     *
     * @param taskListId the task list id
     */
    function addTask(taskListId) {
        const input = document.getElementById("task-input-" + taskListId);
        let task = input.value;
        task = task.trim();

        input.value = "";

        if (!task || task.length === 0) return;

        console.log("Task to add: " + task);

        async function addTask(taskToAdd) {
            const task = await apiService.insertTask(taskListId, taskToAdd);

            if (!task) {
                setAlertMessage("Failed to add task - try to upgrade your policy");
                setAlert(true);
                return;
            }

            console.log("Task added successfully");

            // Update the task list
            const taskListsCopy = [...taskLists];
            const taskList = taskListsCopy.find(tl => tl.id === taskListId);
            taskList.tasks.push(task);
            setTaskLists(taskListsCopy);
        }

        addTask(task);
    }

    return (
        <div>
            <h1>Tasks</h1>
            {alert
                ? <Alert severity='error' onClose={() => setAlert(false)}>{alertMessage}</Alert>
                : <></>}
            {
                taskLists.map(taskList => {
                    return (
                        <div key={taskList.id}>
                            <Card variant={"outlined"} style={{margin: "1rem"}}>
                                <CardContent>
                                    <Typography variant={"h5"}>{taskList.title}</Typography>

                                    <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                                        <TextField key={taskList.id} id={"task-input-" + taskList.id} label="Add a task"
                                                   variant="standard" margin="normal"/>
                                        <IconButton color="primary" aria-label="add" size="medium" onClick={() => {
                                            addTask(taskList.id)
                                        }}>
                                            <AddIcon/>
                                        </IconButton>
                                    </div>

                                    <ul>
                                        {
                                            taskList.tasks.map(task => {
                                                return (<li key={task.id}>{task.title}</li>);
                                            })
                                        }
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })
            }
        </div>
    );
}

export default Tasks;
