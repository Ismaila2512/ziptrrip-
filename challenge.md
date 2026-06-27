# Ziptrrip Tech Challenge - JS Problem Solutions

Here are the solutions for the JavaScript challenge problems provided in the assignment.

## Question 1: Print Pattern

**Problem:** Write a function that takes `n` as input and prints the pattern:
```
1 
21 
321 
4321 
... 
nnnnn(n times) 
```

**Solutions:**

1. Using Nested Loops (Standard approach)
```javascript
function printPattern(n) {
    for (let i = 1; i <= n; i++) {
        let row = "";
        for (let j = i; j > 0; j--) {
            row += j;
        }
        console.log(row);
    }
}

printPattern(5);
```

2. Using String Concatenation 
```javascript
const printPatternAlternative = (n) => {
    let row = "";
    for (let i = 1; i <= n; i++) {
        row = i + row;
        console.log(row);
    }
};

printPatternAlternative(5);
```

## Question 2: Reverse Characters in a String

**Problem:** Write some code to reverse characters in a string.
Input: `"Bhaskara"`
Output: `"araksahB"`

**Solutions:**

1. Using a `for` loop (Iterative approach)
```javascript
const reverseWithLoop = (str) => {
    let rev = "";
    for (let i = str.length - 1; i >= 0; i--) {
        rev += str[i];
    }
    return rev;
};

console.log(reverseWithLoop("Bhaskara"));
```

2. Using Built-in Methods (`split`, `reverse`, `join`)
```javascript
const reverseString = (str) => {
    return str.split('').reverse().join('');
};

console.log(reverseString("Bhaskara"));
```

3. Using `reduce()`
```javascript
const reverseWithReduce = (str) => {
    return str.split('').reduce((reversed, char) => char + reversed, "");
};

console.log(reverseWithReduce("Bhaskara"));
```

4. Using a `for...of` loop
```javascript
const reverseWithForOf = (str) => {
    let reversed = "";
    for (let char of str) {
        reversed = char + reversed; 
    }
    return reversed;
};

console.log(reverseWithForOf("Bhaskara"));
```
