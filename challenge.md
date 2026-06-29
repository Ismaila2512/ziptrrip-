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

## Question 3: Remove Duplicates in an Array

**Problem:** Write some code to remove duplicates in an array and output the unique values.
Input: `[ 1, 2, 3, 6, 4, 3, 7, 4, 2, 6, 8, 2, 5, 9, 0, 1 ]`
Output: `[ 1, 2, 3, 6, 4, 7, 8, 5, 9, 0 ]`

**Solutions:**

1. Using `Array.prototype.filter` and `indexOf`
```javascript
function uniques(arr) {
    const unique = arr.filter((item, index) => {
        return arr.indexOf(item) === index;
    });
    return unique;
}

const res = uniques([1, 2, 3, 6, 4, 3, 7, 4, 2, 6, 8, 2, 5, 9, 0, 1]);
console.log(res);
```

2. Using `Set` (Modern approach)
```javascript
const arr = [1, 2, 3, 6, 4, 3, 7, 4, 2, 6, 8, 2, 5, 9, 0, 1];
const unique = [...new Set(arr)];
console.log(unique);
```


## Question 4: CSS Selectors

**Problem:** Consider the following HTML:
```html
01 <div id="container"> 
02   <div class="box"></div> 
03 
04   <div class="box2"></div> 
05   <div> 
06     <div class="box"></div> 
07   </div> 
08 </div> 
09 
10 <div class="box"></div> 
```
For specific selectors, provide the line numbers of elements selected, explain why they are selected, and explain why others are excluded.

**Solutions:**

- **`.box` : Selects lines [2, 6, 10]**
  - **Why:** The `.` selector targets elements by their class name. Lines 2, 6, and 10 explicitly contain elements with `class="box"`.
  - **Why not others:** Line 4 has the class `box2` (not `box`), and lines 1 and 5 do not have the class `box`.

- **`div .box` : Selects lines [2, 6]**
  - **Why:** This is a descendant selector. It targets any element with `class="box"` that is inside (a descendant of) a `<div>`. Line 2 is inside the `div` on Line 1. Line 6 is inside the `div` on Line 5 (which is inside the `div` on Line 1).
  - **Why not others:** Line 10 is outside of any parent `<div>` element entirely (based on the snippet), so it is not a descendant of a `div`. 

- **`div.box` : Selects lines [2, 6, 10]**
  - **Why:** This combines an element selector with a class selector without a space. It targets `<div>` elements that *also* have the class `box`. Lines 2, 6, and 10 are all `<div>` tags and have `class="box"`. 
  - **Why not others:** Line 4 is a `div` but has class `box2`. Lines 1 and 5 are `div`s but lack the class `box`. *(Note: A previous assumption indicated it selected [None] because it implied combinations, but in HTML they are indeed `<div class="box">`, thus this selector matches them perfectly.)*

- **`[class]` : Selects lines [2, 4, 6, 10]**
  - **Why:** This is an attribute selector. It matches any element that possesses the `class` attribute, regardless of its value. Lines 2, 4, 6, and 10 all have a defined `class` attribute.
  - **Why not others:** Line 1 only has an `id` attribute, and line 5 has no attributes at all.

- **`#container .box` : Selects lines [2, 6]**
  - **Why:** A descendant selector targeting elements with `class="box"` that are nested anywhere inside an element with `id="container"`. Lines 2 and 6 are both contained within the bounds of the `#container` div (lines 1 to 8).
  - **Why not others:** Line 10 is outside of the `#container` element entirely. 

- **`#container > .box` : Selects lines [2]**
  - **Why:** The `>` operator is a direct child combinator. It targets elements with `class="box"` that are *direct* children (one level down) of `#container`. Line 2 is directly inside `#container`.
  - **Why not others:** Line 6 is a descendant, but it is nested inside another `<div>` (Line 5), so it is a "grandchild", not a direct child. Line 10 is outside the container.


## Question 5: Flexbox/Grid CSS Layout

**Problem:** Align 3 boxes horizontally. The outer container can change widths. The first and last boxes should be a fixed width of `100px` (aligned left and right respectively). The middle box should expand dynamically to fill the remaining space. Ensure no overlap.

**Solutions:**

1. Using Flexbox (Recommended)
```css
#container { 
    display: flex; 
    width: 100%; 
}
.left { 
    width: 100px; 
    flex-shrink: 0; /* Prevents box from shrinking below 100px */
}
.right { 
    width: 100px; 
    flex-shrink: 0;
}
.middle { 
    flex: 1; /* Expands to fill available space */
}
```

2. Using CSS Grid
```css
#container { 
    display: grid; 
    grid-template-columns: 100px 1fr 100px; 
    width: 100%;
}

/* The left, middle, and right boxes automatically 
fall into the respective columns. */
```

**Live Demo:** [https://ziptrrip-chi.vercel.app](https://ziptrrip-chi.vercel.app/)
