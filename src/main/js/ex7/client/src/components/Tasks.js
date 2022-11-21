import { useEffect, useState } from 'react';


function Tasks() {
	const [taskLists, setTaskLists] = useState([]);

	useEffect(() => {
		console.log("Fetching task lists");
		async function getTaskLists() {
			const res = await fetch('/api/taskLists');
			const taskLists = await res.json();
			console.log(taskLists);

			for (const taskList of taskLists) {
				const res = await fetch(`/api/tasks?taskListId=${taskList.id}`);
				const tasks = await res.json();

				taskList.tasks = tasks;
			}
			console.log(taskLists);
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