import { useEffect, useState } from 'react';
import {getTaskLists, getTasks} from '../services/apiService';

/**
 * Tasks component.
 */
function Tasks() {
	const [taskLists, setTaskLists] = useState([]);

	useEffect(() => {
		console.log("Fetching task lists");

		async function getTaskLists() {
			const taskLists = await getTaskLists();

			console.log(taskLists);

			for (const taskList of taskLists) {
				const tasks = await getTasks(taskList.id);
				taskList.tasks = tasks;
			}

			setTaskLists(taskLists);
		}

		getTaskLists();
	}, []);

	return (
		<div>
			<h1>Tasks</h1>
			{
				taskLists.map(taskList => {
					return (
						<div key={taskList.id}>
							<h2>{taskList.title}</h2>
							<ul>
								{
									taskList.tasks.map(task => {
										return (
											<li key={task.id}>
												{task.title}
											</li>
										);
									})
								}
							</ul>
						</div>
					);
				})
			}
		</div>
	);
}

export default Tasks;