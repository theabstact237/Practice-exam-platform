#!/usr/bin/env python3
"""Generate python_100_questions.json aligned to the 14-chapter Python Adventure curriculum."""
import json
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent.parent / "exams" / "python_100_questions.json"

# (code, title, default difficulty)
CHAPTERS = [
    ("CH01", "Python Adventure Start", "easy"),
    ("CH02", "Variables", "easy"),
    ("CH03", "Data Types", "easy"),
    ("CH04", "Print / Input", "easy"),
    ("CH05", "Conditional If/Else", "easy"),
    ("CH06", "While Loops", "medium"),
    ("CH07", "For Loops", "medium"),
    ("CH08", "Lists", "medium"),
    ("CH09", "Dictionaries", "medium"),
    ("CH10", "Tuples / Sets", "medium"),
    ("CH11", "Modular Functions", "medium"),
    ("CH12", "Classes / OOP", "hard"),
    ("CH13", "API Integration", "hard"),
    ("CH14", "Master Programmer", "hard"),
]

# (chapter_index, question_type, question_text, correct, wrong_options, hint, explanation)
RAW = [
    # ── CH01: Python Adventure Start (8) — 5 mcq + 3 direct ─────────────────
    (0, "mcq", "What is Python primarily known for?", "Readable syntax and versatility",
     ["Only web design", "Only hardware control", "Being compiled like C only"], None,
     "Python is praised for clean, readable syntax and is used in web, data, AI, automation, and more."),
    (0, "mcq", "Which file extension is standard for Python source code?", ".py",
     [".python", ".pt", ".pyt"], None,
     "Python files end in .py — for example hello.py."),
    (0, "direct", "What command runs a Python script named app.py from the terminal?", "python app.py",
     ["run app.py", "exec app.py", "start app.py"], "Use the python interpreter followed by the filename.",
     "python app.py tells the Python interpreter to execute the file. On some systems use python3."),
    (0, "mcq", "Who created Python?", "Guido van Rossum",
     ["Elon Musk", "Bill Gates", "James Gosling"], None,
     "Guido van Rossum created Python; it first appeared in 1991."),
    (0, "direct", "What is an interpreter in Python?", "A program that runs code line by line",
     ["A text editor", "A database", "A web browser"], "It reads and executes your .py file.",
     "Python is interpreted — the interpreter translates and runs your code without a separate compile step."),
    (0, "mcq", "Which symbol starts a comment in Python?", "#",
     ["//", "--", "/*"], None,
     "Everything after # on a line is ignored by Python — useful for notes and explanations."),
    (0, "direct", "What built-in function displays help for a function or module?", "help",
     ["info", "doc", "manual"], "Four letters, help(print) works.",
     "help(len) opens documentation for len. Use docstrings for your own functions too."),
    (0, "mcq", "Why is Python popular for beginners?", "Simple syntax and a large supportive community",
     ["It has no errors", "It requires no practice", "It only runs on one OS"], None,
     "Readable code, huge libraries, and beginner-friendly resources make Python a great first language."),

    # ── CH02: Variables (7) ───────────────────────────────────────────────────
    (1, "mcq", "What is the correct way to assign 42 to a variable named age?", "age = 42",
     ["42 = age", "var age = 42", "int age = 42"], None,
     "Python uses name = value. No var or type keyword is required for assignment."),
    (1, "direct", "What naming style does PEP 8 recommend for variable names?", "snake_case",
     ["camelCase", "ALL CAPS", "kebab-case"], "Words separated by underscores.",
     "snake_case like user_name is the Python convention for variables and functions."),
    (1, "mcq", "What happens when you assign x = 10?", "x now refers to the integer 10",
     ["x is declared but empty", "Python asks for a type", "x becomes a string"], None,
     "Assignment binds a name to an object. x = 10 makes x reference the int 10."),
    (1, "mcq", "Can a variable name start with a number in Python?", "No",
     ["Yes", "Only if quoted", "Only for floats"], None,
     "Identifiers must start with a letter or underscore — 2name is invalid."),
    (1, "direct", "What keyword deletes a variable binding?", "del",
     ["remove", "delete", "drop"], "Three letters.",
     "del x removes the name x from the namespace; the object may be garbage-collected if unreferenced."),
    (1, "mcq", "What is x = x + 1 called?", "Reassigning the variable",
     ["Defining a constant", "Creating a tuple", "Importing a module"], None,
     "Variables can be rebound to new values — x = x + 1 updates what x refers to."),
    (1, "mcq", "Which is a valid variable name?", "my_score",
     ["2score", "my-score", "class"], None,
     "my_score is valid. 2score starts with a digit; my-score has a hyphen; class is a reserved keyword."),

    # ── CH03: Data Types (7) ──────────────────────────────────────────────────
    (2, "mcq", "What built-in function returns the type of a value?", "type",
     ["typeof", "class", "kind"], None,
     "type(3) returns <class 'int'>. type('hi') returns <class 'str'>."),
    (2, "direct", "What keyword represents no value in Python?", "None",
     ["null", "nil", "empty"], "Capital N, four letters.",
     "None is Python's null — a singleton meaning absence of value."),
    (2, "mcq", "Which of these is a float?", "3.14",
     ["3", "'3.14'", "314"], None,
     "3 is int, '3.14' is str, 3.14 is float (decimal point)."),
    (2, "mcq", "What is the type of True in Python?", "bool",
     ["int", "str", "Boolean class only in Java"], None,
     "True and False are bool values. bool is a subclass of int in Python."),
    (2, "direct", "What function converts '123' to the integer 123?", "int",
     ["str", "float", "num"], "Three-letter built-in.",
     "int('123') → 123. str(123) → '123'. float('3.5') → 3.5."),
    (2, "mcq", "Which values are falsy in Python?", "0, empty string, None, empty list",
     ["Only False", "Only 0", "Negative numbers only"], None,
     "Falsy: False, None, 0, '', [], {}, set(), etc. Most objects are truthy."),
    (2, "mcq", "What does isinstance('hello', str) return?", "True",
     ["False", "str", "Error always"], None,
     "isinstance checks whether an object is an instance of a class — 'hello' is a str."),

    # ── CH04: Print / Input (7) ───────────────────────────────────────────────
    (3, "mcq", "What function displays output to the console?", "print",
     ["echo", "display", "output"], None,
     "print('Hello') writes Hello to stdout. Multiple values: print(a, b)."),
    (3, "direct", "What function reads a line of text from the user?", "input",
     ["read", "scan", "gets"], "Five letters, returns a string.",
     "name = input('Your name: ') always returns a string, even if the user types digits."),
    (3, "mcq", "What does print('a', 'b', sep='-') output?", "a-b",
     ["a b", "a-b-", "ab"], None,
     "sep='-' joins arguments with a dash instead of the default space."),
    (3, "mcq", "What does end='' do in print()?", "Prevents adding a newline at the end",
     ["Prints nothing", "Repeats output", "Clears the screen"], None,
     "Default end is '\\n'. end='' keeps the cursor on the same line for the next print."),
    (3, "direct", "How do you embed a variable in an f-string?", "Curly braces around the variable",
     ["Square brackets", "Parentheses only", "Dollar sign prefix"], "f'Hello {name}'",
     "f'Hello {name}' evaluates name inside {} at runtime."),
    (3, "mcq", "What type does input() always return?", "str",
     ["int", "float", "Depends on user input type"], None,
     "input() always gives a string — use int(input()) to read numbers."),
    (3, "mcq", "What does print(type(input())) show when the user types 42?", "<class 'str'>",
     ["<class 'int'>", "<class 'float'>", "42"], None,
     "Even numeric input is read as the string '42' until you convert it."),

    # ── CH05: Conditional If/Else (7) ─────────────────────────────────────────
    (4, "mcq", "Which keyword starts a conditional block?", "if",
     ["when", "case", "cond"], None,
     "if condition: followed by an indented block is Python's basic branch."),
    (4, "direct", "What keyword provides an alternative when if is False?", "else",
     ["elif", "otherwise", "except"], "Five letters.",
     "if score >= 60: pass else: print('Try again') runs else when the condition fails."),
    (4, "mcq", "What does elif stand for?", "else if",
     ["end if", "else loop", "error if"], None,
     "elif lets you chain multiple conditions between if and else."),
    (4, "mcq", "Which operator checks equality?", "==",
     ["=", "===", "eq"], None,
     "= assigns; == compares. '5' == 5 is False (different types)."),
    (4, "direct", "What operator checks inequality?", "!=",
     ["<>", "!==", "=/="], "Exclamation plus equals.",
     "5 != 3 is True. Python 3 removed the <> operator."),
    (4, "mcq", "What is the result of bool(0)?", "False",
     ["True", "0", "None"], None,
     "Zero is falsy; non-zero numbers are truthy."),
    (4, "mcq", "Which logical operator means 'both conditions must be True'?", "and",
     ["&&", "&", "AND keyword only in SQL"], None,
     "Python uses and, or, not — not C-style && || !."),

    # ── CH06: While Loops (7) ─────────────────────────────────────────────────
    (5, "mcq", "Which loop repeats while a condition is True?", "while",
     ["for", "loop", "repeat"], None,
     "while count < 5: runs until count < 5 becomes False."),
    (5, "direct", "What keyword exits a while loop immediately?", "break",
     ["exit", "stop", "return"], "Also works in for loops.",
     "break leaves the innermost loop — useful when a stop condition is met early."),
    (5, "mcq", "What does continue do in a while loop?", "Skips to the next iteration",
     ["Exits the loop", "Restarts Python", "Pauses forever"], None,
     "continue jumps to the loop condition check, skipping remaining code in the body."),
    (5, "mcq", "What is an infinite loop risk with while True:", "Forgetting a break or condition change inside",
     ["Using print", "Using integers", "Using comments"], None,
     "while True: needs break or a condition that eventually becomes False."),
    (5, "direct", "What pattern counts from 0 to 4 in a while loop?", "Initialize counter, while counter < 5, increment",
     ["Use for only", "Use break first", "Use import"], "count = 0; while count < 5: ...; count += 1",
     "Initialize before the loop, test the condition, update the counter inside the body."),
    (5, "mcq", "When is a while loop better than for?", "When repetitions depend on a condition, not a fixed sequence",
     ["Always", "Never", "Only for strings"], None,
     "while suits unknown iterations — e.g. 'keep asking until valid input'."),
    (5, "mcq", "What does this print? n=3; while n: print(n); n-=1", "3, 2, 1 each on its own line",
     ["3 2 1 0", "Infinite loop", "Nothing"], None,
     "n counts down; 0 is falsy so the loop stops before printing 0."),

    # ── CH07: For Loops (7) ───────────────────────────────────────────────────
    (6, "mcq", "What does for letter in 'hi': iterate over?", "Each character in the string",
     ["Only integers", "File lines only", "Dictionary keys only"], None,
     "for loops iterate any iterable — strings, lists, ranges, dict keys, etc."),
    (6, "direct", "What function generates 0, 1, 2, 3, 4?", "range(5)",
     ["range(4)", "list(5)", "count(5)"], "Stop value is exclusive.",
     "range(5) yields 0 through 4. range(1, 6) yields 1 through 5."),
    (6, "mcq", "What does range(2, 10, 2) produce?", "2, 4, 6, 8",
     ["2, 4, 6, 8, 10", "0, 2, 4, 6, 8", "2, 3, 4, 5"], None,
     "range(start, stop, step) — stop is exclusive, step is 2 here."),
    (6, "mcq", "How do you loop with index and value from a list?", "for i, v in enumerate(items):",
     ["for i in items.index:", "for items[i]:", "while enumerate:"], None,
     "enumerate pairs each index with its value — common in for-loop patterns."),
    (6, "direct", "What keyword pairs with for to loop over two lists together?", "zip",
     ["map", "join", "pair"], "Four letters, built-in.",
     "for a, b in zip(names, scores): processes parallel elements from both lists."),
    (6, "mcq", "What is printed? for i in range(3): print(i, end=' ')", "0 1 2 ",
     ["1 2 3", "0 1 2 3", "012"], None,
     "range(3) is 0,1,2. end=' ' adds spaces instead of newlines."),
    (6, "mcq", "Can you use break inside a for loop?", "Yes",
     ["No", "Only in while", "Only with range"], None,
     "break and continue work in both for and while loops."),

    # ── CH08: Lists (7) ───────────────────────────────────────────────────────
    (7, "mcq", "Which syntax creates a list?", "[1, 2, 3]",
     ["(1, 2, 3)", "{1, 2, 3}", "<1, 2, 3>"], None,
     "Square brackets create lists — ordered, mutable sequences."),
    (7, "direct", "What index gets the first element of a list?", "0",
     ["1", "-0", "first"], "Python is zero-indexed.",
     "items[0] is first; items[-1] is last."),
    (7, "mcq", "Which method adds an item to the end of a list?", "append()",
     ["add()", "push()", "insert_end()"], None,
     "append(x) modifies the list in place. insert(i, x) adds at index i."),
    (7, "mcq", "What does [1, 2] + [3, 4] produce?", "[1, 2, 3, 4]",
     ["[4, 6]", "[7]", "Error"], None,
     "+ concatenates lists; it does not add numbers element-wise."),
    (7, "direct", "What method removes and returns the last list item?", "pop",
     ["remove", "delete", "last"], "Also accepts an index.",
     "pop() removes last item. pop(0) removes first. remove(x) deletes first match of value x."),
    (7, "mcq", "What does len([10, 20, 30]) return?", "3",
     ["30", "2", "Error"], None,
     "len() counts elements — three items in this list."),
    (7, "mcq", "Which slice returns the first two elements of nums?", "nums[:2]",
     ["nums[1:2]", "nums[0:1]", "nums[2:]"], None,
     "nums[:2] is indices 0 and 1 — stop index 2 is excluded."),

    # ── CH09: Dictionaries (7) ────────────────────────────────────────────────
    (8, "mcq", "Which syntax creates a dictionary?", "{'name': 'Ada', 'age': 30}",
     ["['name', 'Ada']", "('name', 'Ada')", "<name: Ada>"], None,
     "Curly braces with key: value pairs define dicts."),
    (8, "direct", "What method safely returns a default when a key is missing?", "get",
     ["find", "fetch", "lookup"], "d.get('key', default)",
     "d.get('score', 0) returns 0 instead of KeyError if 'score' is absent."),
    (8, "mcq", "How do you access the value for key 'id' in d?", "d['id']",
     ["d.id", "d(id)", "d->id"], None,
     "Square brackets with the key — KeyError if the key does not exist."),
    (8, "mcq", "What does d.keys() return?", "A view of all keys",
     ["A list always", "Only the first key", "Values only"], None,
     "keys(), values(), items() return dynamic view objects in Python 3."),
    (8, "direct", "What method loops key-value pairs?", "items",
     ["pairs", "entries", "values"], "for k, v in d.items():",
     "items() returns (key, value) tuples for iteration."),
    (8, "mcq", "Can a list be used as a dictionary key?", "No — lists are unhashable",
     ["Yes always", "Only if empty", "Only for strings inside"], None,
     "Dict keys must be hashable/immutable — use tuples instead of lists for composite keys."),
    (8, "mcq", "What does {'a': 1, **{'b': 2}} create?", "{'a': 1, 'b': 2}",
     ["Error", "{'b': 2}", "A set"], None,
     "** unpacks dicts inside literals to merge them (Python 3.5+)."),

    # ── CH10: Tuples / Sets (7) ───────────────────────────────────────────────
    (9, "mcq", "Which collection is immutable and ordered?", "tuple",
     ["list", "set", "dict"], None,
     "Tuples use () — (1, 2, 3) cannot be changed after creation."),
    (9, "direct", "How do you write a one-element tuple containing 42?", "(42,)",
     ["(42)", "[42]", "{42}"], "Trailing comma required.",
     "(42) is just the integer 42 in parentheses. (42,) is a tuple."),
    (9, "mcq", "Which collection stores unique unordered elements?", "set",
     ["list", "tuple", "dict"], None,
     "set([1,1,2]) → {1, 2}. Sets deduplicate automatically."),
    (9, "mcq", "What is frozenset?", "An immutable set",
     ["A frozen list", "A sorted tuple", "A locked dict"], None,
     "frozenset can be a dict key because it is hashable unlike a regular set."),
    (9, "direct", "What operator returns elements in A but not in B for sets?", "-",
     ["&", "|", "^"], "Set difference with minus.",
     "A - B or A.difference(B) — elements in A that are not in B."),
    (9, "mcq", "What does {1, 2} & {2, 3} return?", "{2}",
     ["{1, 2, 3}", "{1, 3}", "Error"], None,
     "& is set intersection — elements in both sets."),
    (9, "mcq", "Which is valid for swapping values a and b?", "a, b = b, a",
     ["swap(a, b)", "a = b only", "exchange a b"], None,
     "Tuple unpacking makes swap one line without a temp variable."),

    # ── CH11: Modular Functions (7) ───────────────────────────────────────────
    (10, "mcq", "What keyword defines a function?", "def",
     ["function", "func", "fn"], None,
     "def greet(name): starts a function definition with an indented body."),
    (10, "direct", "What keyword sends a value back to the caller?", "return",
     ["yield", "send", "output"], "Six letters.",
     "return value exits the function. No return means the function returns None."),
    (10, "mcq", "What does *args collect in def f(*args):?", "Extra positional arguments as a tuple",
     ["Keyword arguments", "Global variables", "Import paths"], None,
     "*args gathers surplus positional args — useful for flexible signatures."),
    (10, "mcq", "What is a function parameter with a default value?", "Default parameter",
     ["Static arg", "Global arg", "Fixed constant"], None,
     "def power(x, n=2): lets callers omit n to default to 2."),
    (10, "direct", "What statement makes code from another file available?", "import",
     ["include", "require", "using"], "import math or from math import sqrt",
     "import loads a module; from x import y brings a specific name into scope."),
    (10, "mcq", "What is the scope of a variable created inside a function?", "Local to that function",
     ["Always global", "Module level", "Class only"], None,
     "Local variables exist only during the function call unless declared global."),
    (10, "mcq", "What does if __name__ == '__main__': guard?", "Code that runs only when the file is executed directly",
     ["Code on import only", "Class definitions", "All test code always"], None,
     "Prevents script setup code from running when the module is imported elsewhere."),

    # ── CH12: Classes / OOP (7) ───────────────────────────────────────────────
    (11, "mcq", "Which defines a class?", "class Dog:",
     ["def Dog:", "object Dog:", "new Dog:"], None,
     "class Name: with indented methods and attributes defines a new type."),
    (11, "direct", "What special method initializes a new instance?", "__init__",
     ["__new__", "__start__", "__create__"], "Double underscores both sides.",
     "__init__(self, ...) sets up instance state when an object is created."),
    (11, "mcq", "What is self in an instance method?", "Reference to the current object",
     ["The class itself", "A global variable", "The parent module"], None,
     "self is convention for the instance — self.name accesses instance attributes."),
    (11, "mcq", "What does inheritance allow?", "A child class to reuse and extend a parent class",
     ["Only one method per class", "No method overriding", "Deleting parent code"], None,
     "class Puppy(Dog): inherits attributes and methods from Dog."),
    (11, "direct", "What function checks if obj is an instance of a class?", "isinstance",
     ["type", "issubclass", "typeof"], "is + instance.",
     "isinstance(obj, Dog) is True for Dog instances and subclasses."),
    (11, "mcq", "What does @property enable?", "Using a method like an attribute",
     ["Private variables only", "Deleting methods", "Multiple inheritance ban"], None,
     "@property def area(self): allows obj.area without parentheses."),
    (11, "mcq", "What does super().__init__() typically do?", "Calls the parent class initializer",
     ["Deletes the object", "Imports a module", "Creates a global"], None,
     "super() delegates to the parent — common in __init__ for proper setup."),

    # ── CH13: API Integration (7) ───────────────────────────────────────────
    (12, "mcq", "Which HTTP method usually fetches data from an API?", "GET",
     ["POST", "DELETE", "PATCH"], None,
     "GET retrieves resources. POST often creates or submits data."),
    (12, "direct", "What library is commonly used for HTTP requests in Python?", "requests",
     ["urllib only", "httpclient", "fetch"], "pip install requests",
     "requests.get(url) returns a Response with status_code, json(), and text."),
    (12, "mcq", "What does HTTP status code 200 mean?", "OK — success",
     ["Not Found", "Server Error", "Unauthorized"], None,
     "2xx = success, 4xx = client error, 5xx = server error."),
    (12, "mcq", "What does response.json() do in requests?", "Parses the response body as JSON into Python objects",
     ["Sends JSON", "Prints raw text only", "Closes the connection always"], None,
     "json() converts JSON strings to dicts/lists — essential for REST APIs."),
    (12, "direct", "What header often carries a Bearer token?", "Authorization",
     ["Content-Type", "Accept", "Cookie only"], "Authorization: Bearer <token>",
     "APIs use Authorization headers for authenticated requests."),
    (12, "mcq", "What is an API endpoint?", "A specific URL that exposes a resource or action",
     ["A Python file only", "A database table", "An IDE setting"], None,
     "https://api.example.com/users/1 is an endpoint returning user data."),
    (12, "mcq", "What does status code 404 indicate?", "Resource not found",
     ["Success", "Internal server error", "Bad gateway only"], None,
     "404 means the server could not find the requested URL or resource."),

    # ── CH14: Master Programmer (8) — capstone hard mix ───────────────────────
    (13, "mcq", "What does a list comprehension [x*2 for x in range(4)] produce?", "[0, 2, 4, 6]",
     ["[2, 4, 6, 8]", "[0, 1, 2, 3]", "Error"], None,
     "Comprehensions build lists concisely — doubles each value from range(4)."),
    (13, "direct", "What statement ensures a file is closed even on errors?", "with open(...) as f:",
     ["try only", "close() always manual", "import file"], "Context manager pattern.",
     "with triggers __enter__/__exit__ — the file closes automatically when the block ends."),
    (13, "mcq", "What does json.dumps({'a': 1}) return?", "A JSON string",
     ["A Python dict", "A file handle", "An integer"], None,
     "dumps = dict to string. loads = string to dict. dump writes to a file."),
    (13, "mcq", "Which handles exceptions in Python?", "try/except",
     ["catch/finally only", "error/handle", "if/except"], None,
     "try: risky code except ValueError: handle specific errors gracefully."),
    (13, "direct", "What tool installs packages from PyPI?", "pip",
     ["npm", "apt only", "python install"], "pip install package_name",
     "pip is Python's package manager — use requirements.txt for project deps."),
    (13, "mcq", "What is a virtual environment (venv) for?", "Isolating project dependencies",
     ["Making Python faster", "Replacing the interpreter", "Deploying HTML only"], None,
     "venv keeps each project's packages separate — avoids version conflicts."),
    (13, "mcq", "What pattern reads API data, parses JSON, and handles errors?", "try/except around requests.get and response.json()",
     ["print only", "while True only", "No error handling needed"], None,
     "Production code wraps network calls in try/except and checks status codes."),
    (13, "direct", "What skill marks a Master Programmer in this course?", "Combining variables, logic, data structures, functions, OOP, and APIs in projects",
     ["Memorizing syntax only", "Using one loop type only", "Avoiding libraries"], "Think full-stack Python thinking.",
     "Mastery means building complete programs — input, logic, data, modules, classes, and real API integration."),
]

assert len(RAW) == 100, f"Expected 100 questions, got {len(RAW)}"

LETTERS = ["A", "B", "C", "D"]


def build_options(correct: str, wrong: list[str]) -> tuple[list[dict], str]:
    opts = [correct] + wrong[:3]
    seen = set()
    unique = []
    for o in opts:
        if o not in seen:
            seen.add(o)
            unique.append(o)
    while len(unique) < 4:
        unique.append(f"Option {len(unique) + 1}")
    unique = unique[:4]
    idx = hash(correct) % 4
    ordered = unique[idx:] + unique[:idx]
    correct_letter = LETTERS[ordered.index(correct)]
    return [{"letter": LETTERS[i], "text": ordered[i]} for i in range(4)], correct_letter


def main():
    mcq_count = sum(1 for q in RAW if q[1] == "mcq")
    direct_count = sum(1 for q in RAW if q[1] == "direct")
    assert mcq_count == 70, mcq_count
    assert direct_count == 30, direct_count

    questions = []
    for ch_idx, qtype, text, correct, wrong, hint, explanation in RAW:
        code, title, difficulty = CHAPTERS[ch_idx]
        domain = f"{code}: {title}"
        options, correct_letter = build_options(correct, wrong)
        exp = explanation
        if qtype == "direct" and hint:
            exp = f"Hint: {hint}\n\n{explanation}"
        questions.append({
            "question_text": text,
            "question_type": qtype,
            "domain": domain,
            "chapter_code": code,
            "chapter": title,
            "difficulty": difficulty,
            "hint": hint or "",
            "explanation": exp,
            "correct_answer_letter": correct_letter,
            "options": options,
        })

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Wrote {len(questions)} questions to {OUTPUT}")
    print(f"  MCQ: {mcq_count}, Direct: {direct_count}")
    for code, title, _ in CHAPTERS:
        n = sum(1 for q in questions if q["chapter_code"] == code)
        print(f"  {code} {title}: {n}")


if __name__ == "__main__":
    main()
