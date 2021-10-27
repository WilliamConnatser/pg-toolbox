/*
    Combines an array prettily
        arr = the array to be combined
        lastDescriptor = if arr is greater than one in length, then this value will be prepended before the last item
            (add "and" or "or" before the last item)
*/
export const formatArray = (arr, lastDescriptor) => {
    return arr
        .map(
            (command, index) =>
                `${
                    lastDescriptor && index === arr.length - 1 && arr.length > 1 ? `${lastDescriptor} ` : ''
                }"${command}"`,
        )
        .join(', ')
}

//Explain where to get more info incase of CLI syntax errors
export const wrapSyntaxError = (err) => {
    console.error(`\n[pg-toolbox] Syntax Error: ${err}\n\n\tRun 'pg-toolbox --help' for more information\n\n`)
    process.exit()
}
