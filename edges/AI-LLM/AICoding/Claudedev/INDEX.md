# Claude dev

- [Tools](#tools)

---

<https://github.com/project-copilot/claude-dev>

Claude Dev uses an autonomous task execution loop with chain-of-thought prompting and access to powerful tools that give him the ability to accomplish nearly any task. Start by providing a task and the loop fires off, where Claude might use certain tools (with your permission) to accomplish each step in his thought process.

### <font style="color:rgb(31, 35, 40);">Tools</font>

<font style="color:rgb(31, 35, 40);">Claude Dev has access to the following capabilities:</font>

1. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">execute_command</font>**</code><font style="color:rgb(31, 35, 40);">: Execute terminal commands on the system (only with your permission, output is streamed into the chat and you can respond to stdin or exit long-running processes when you're ready)</font>
2. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">read_file</font>**</code><font style="color:rgb(31, 35, 40);">: Read the contents of a file at the specified path</font>
3. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">write_to_file</font>**</code><font style="color:rgb(31, 35, 40);">: Write content to a file at the specified path, automatically creating any necessary directories</font>
4. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">list_files</font>**</code><font style="color:rgb(31, 35, 40);">: List all paths for files in the specified directory. When</font><font style="color:rgb(31, 35, 40);"> </font><code><font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">recursive = true</font></code><font style="color:rgb(31, 35, 40);">, it recursively lists all files in the directory and its nested folders (excludes files in .gitignore). When</font><font style="color:rgb(31, 35, 40);"> </font><code><font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">recursive = false</font></code><font style="color:rgb(31, 35, 40);">, it lists only top-level files (useful for generic file operations like retrieving a file from your Desktop).</font>
5. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">list_code_definition_names</font>**</code><font style="color:rgb(31, 35, 40);">: Parses all source code files at the top level of the specified directory to extract names of key elements like classes and functions (see more below)</font>
6. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">search_files</font>**</code><font style="color:rgb(31, 35, 40);">: Search files in a specified directory for text that matches a given regex pattern (useful for refactoring code, addressing TODOs and FIXMEs, removing dead code, etc.)</font>
7. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">ask_followup_question</font>**</code><font style="color:rgb(31, 35, 40);">: Ask the user a question to gather additional information needed to complete a task (due to the autonomous nature of the program, this isn't a typical chatbot–Claude Dev must explicitly interrupt his task loop to ask for more information)</font>
8. <code>**<font style="color:rgb(31, 35, 40);background-color:rgba(129, 139, 152, 0.12);">attempt_completion</font>**</code><font style="color:rgb(31, 35, 40);">: Present the result to the user after completing a task, potentially with a terminal command to kickoff a demonstration</font>


> 更新: 2025-09-22 10:11:46  
> 原文: <https://www.yuque.com/viruspc/el3mi0/whobhmvwdrc71ar7>