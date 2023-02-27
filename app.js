const inquirer = require('inquirer');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Caviar15Mango',
  database: 'employee_db'
});

connection.connect((err) => {
  if (err) throw err;
  console.log(`Connected to MySQL database as ID ${connection.threadId}`);
  start();
});

function start() {
  inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'What would you like to do?',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Quit'
    ]
  }).then((answer) => {
    switch (answer.action) {
      case 'View all departments':
        viewAllDepartments();
        break;
      case 'View all roles':
        viewAllRoles();
        break;
      case 'View all employees':
        viewAllEmployees();
        break;
      case 'Add a department':
        addDepartment();
        break;
      case 'Add a role':
        addRole();
        break;
      case 'Add an employee':
        addEmployee();
        break;
      case 'Update an employee role':
        updateEmployeeRole();
        break;
      case 'Quit':
        console.log('Goodbye!');
        connection.end();
        break;
    }
  });
}

function viewAllDepartments() {
  connection.query('SELECT * FROM department', (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function viewAllRoles() {
  connection.query(`
    SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    LEFT JOIN department ON role.department_id = department.id
  `, (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function viewAllEmployees() {
  connection.query(`
    SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, CONCAT("$", role.salary) AS salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    LEFT JOIN role ON e.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN employee m ON e.manager_id = m.id
  `, (err, res) => {
    if (err) throw err;
    console.table(res);
    start();
  });
}

function addDepartment() {
  inquirer.prompt({
    name: 'name',
    type: 'input',
    message: 'Please provide the name of the department that you would like to create:'
  }).then((answer) => {
    connection.query('INSERT INTO department SET ?', { name: answer.name }, (err, res) => {
      if (err) throw err;
      console.log(`Department "${answer.name}" added to the database`);
      start();
    });
  });
}
function addEmployee() {
  connection.query('SELECT * FROM role', (err, roles) => {
    if (err) throw err;
    connection.query('SELECT * FROM employee', (err, employees) => {
      if (err) throw err;
      inquirer.prompt([
        {
          name: 'first_name',
          type: 'input',
          message: 'Enter the first name:',
        },
        {
          name: 'last_name',
          type: 'input',
          message: 'Enter the last name:',
        },
        {
          name: 'role_id',
          type: 'list',
          message: 'Select the role:',
          choices: roles.map((role) => ({
            name: role.title,
            value: role.id,
          })),
        },
        {
          name: 'manager_id',
          type: 'list',
          message: 'Select the manager:',
          choices: employees
            .filter((employee) => employee.manager_id === null)
            .map((employee) => ({
              name: `${employee.first_name} ${employee.last_name}`,
              value: employee.id,
            })),
        },
      ]).then((answer) => {
        connection.query(
          'INSERT INTO employee SET ?',
          {
            first_name: answer.first_name,
            last_name: answer.last_name,
            role_id: answer.role_id,
            manager_id: answer.manager_id,
          },
          (err, res) => {
            if (err) throw err;
            console.log(`Employee "${answer.first_name} ${answer.last_name}" added to the database`);
            start();
          }
        );
      });
    });
  });
}

function addRole() {
  connection.query('SELECT * FROM department', (err, departments) => {
    if (err) throw err;
    inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'Enter the title:',
      },
      {
        name: 'salary',
        type: 'input',
        message: 'Enter the salary:',
        validate: (input) => {
          if (isNaN(input)) {
            return 'Please enter a valid number';
          }
          return true;
        },
      },
      {
        name: 'department_id',
        type: 'list',
        message: 'Select the department:',
        choices: departments.map((department) => ({
          name: department.name,
          value: department.id,
        })),
      },
    ]).then((answer) => {
      connection.query(
        'INSERT INTO role SET ?',
        {
          title: answer.title,
          salary: answer.salary,
          department_id: answer.department_id,
        },
        (err, res) => {
          if (err) throw err;
          console.log(`Role "${answer.title}" added to the database`);
          start();
        }
      );
    });
  });
}
function updateEmployeeRole() {
  connection.query('SELECT * FROM employee', (err, employees) => {
    if (err) throw err;
    connection.query('SELECT * FROM role', (err, roles) => {
      if (err) throw err;
      inquirer
        .prompt([
          {
            name: 'employee',
            type: 'list',
            message: 'Select the employee to update:',
            choices: employees.map((employee) => ({
              name: `${employee.first_name} ${employee.last_name}`,
              value: employee.id,
            })),
          },
          {
            name: 'role',
            type: 'list',
            message: 'Select the new role:',
            choices: roles.map((role) => ({
              name: role.title,
              value: role.id,
            })),
          },
        ])
        .then((answer) => {
          connection.query(
            'UPDATE employee SET role_id = ? WHERE id = ?',
            [answer.role, answer.employee],
            (err, res) => {
              if (err) throw err;
              console.log(`Employee's role updated successfully`);
              start();
            }
          );
        });
    });
  });
}

//   GIVEN a command-line application that accepts user input
// WHEN I start the application
// THEN I am presented with the following options: view all departments, view all roles, view all employees, add a department, add a role, add an employee, and update an employee role
// WHEN I choose to view all departments
// THEN I am presented with a formatted table showing department names and department ids
// WHEN I choose to view all roles
// THEN I am presented with the job title, role id, the department that role belongs to, and the salary for that role
// WHEN I choose to view all employees
// THEN I am presented with a formatted table showing employee data, including employee ids, first names, last names, job titles, departments, salaries, and managers that the employees report to
// WHEN I choose to add a department
// THEN I am prompted to enter the name of the department and that department is added to the database
// WHEN I choose to add a role
// THEN I am prompted to enter the name, salary, and department for the role and that role is added to the database
// WHEN I choose to add an employee
// THEN I am prompted to enter the employee’s first name, last name, role, and manager, and that employee is added to the database
// WHEN I choose to update an employee role
// THEN I am prompted to select an employee to update and their new role and this information is updated in the database