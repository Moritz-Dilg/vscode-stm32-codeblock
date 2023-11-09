# STM32 CodeBlock

This extension analyses you currently open Editor for any generated code by `STM32CubeMX` for your STM32 projects. This generated code contains areas - marked by comments, where you are allowed to write your own code (STM32CubeMX may overwrite the other parts if changes have been made and new code has been generated). This can easily get confusing, where this extension comes to play.

## Features

- Clicking a CodeBlock within the tree will scroll to the CodeBlock and put the cursor on the line at the beginning of it

- Found CodeBlocks are highlighted in open files

![ADC_Example](https://raw.githubusercontent.com/Moritz-Dilg/vscode-stm32-codeblock/master/images/ADC_Example.png)