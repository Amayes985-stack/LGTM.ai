from typing import List, Dict, Any
import re

class SecurityScanner:
    def __init__(self):
        self.patterns = self._load_security_patterns()
    
    def _load_security_patterns(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Define security patterns for different languages
        """
        return {
            "python": [
                {
                    "pattern": r"eval\s*\(",
                    "title": "Dangerous use of eval()",
                    "description": "Using eval() can execute arbitrary code and is a security risk. Consider using ast.literal_eval() or json.loads() for safe evaluation.",
                    "severity": "critical"
                },
                {
                    "pattern": r"pickle\.loads\s*\(",
                    "title": "Unsafe deserialization with pickle",
                    "description": "pickle.loads() can execute arbitrary code. Only unpickle data from trusted sources or use safer alternatives like json.",
                    "severity": "high"
                },
                {
                    "pattern": r"os\.system\s*\(",
                    "title": "Command injection risk",
                    "description": "os.system() is vulnerable to command injection. Use subprocess.run() with shell=False instead.",
                    "severity": "high"
                },
                {
                    "pattern": r"exec\s*\(",
                    "title": "Dangerous use of exec()",
                    "description": "exec() can execute arbitrary code and should be avoided. Consider refactoring to use safer alternatives.",
                    "severity": "critical"
                },
                {
                    "pattern": r"(password|secret|api_key)\s*=\s*['\"][^'\"]+['\"]",
                    "title": "Hardcoded credentials detected",
                    "description": "Credentials should never be hardcoded. Use environment variables or secure credential management systems.",
                    "severity": "critical"
                },
                {
                    "pattern": r"sql.*\+.*%s",
                    "title": "Potential SQL injection",
                    "description": "String concatenation in SQL queries can lead to SQL injection. Use parameterized queries instead.",
                    "severity": "critical"
                }
            ],
            "javascript": [
                {
                    "pattern": r"eval\s*\(",
                    "title": "Dangerous use of eval()",
                    "description": "eval() can execute arbitrary code and is a major security risk. Consider using JSON.parse() or other safe alternatives.",
                    "severity": "critical"
                },
                {
                    "pattern": r"innerHTML\s*=",
                    "title": "XSS vulnerability with innerHTML",
                    "description": "Setting innerHTML directly can lead to XSS attacks. Use textContent or sanitize the input first.",
                    "severity": "high"
                },
                {
                    "pattern": r"dangerouslySetInnerHTML",
                    "title": "React XSS risk",
                    "description": "dangerouslySetInnerHTML can lead to XSS attacks. Ensure content is properly sanitized before use.",
                    "severity": "high"
                },
                {
                    "pattern": r"(password|secret|apiKey|api_key)\s*[:=]\s*['\"][^'\"]+['\"]",
                    "title": "Hardcoded credentials detected",
                    "description": "Credentials should never be hardcoded. Use environment variables or secure configuration management.",
                    "severity": "critical"
                },
                {
                    "pattern": r"localStorage\.setItem.*password",
                    "title": "Sensitive data in localStorage",
                    "description": "Storing sensitive data like passwords in localStorage is insecure. Use secure, httpOnly cookies or sessionStorage with encryption.",
                    "severity": "high"
                },
                {
                    "pattern": r"\$\{.*\}",
                    "title": "Potential template injection",
                    "description": "Template literals with user input can lead to code injection. Validate and sanitize user input.",
                    "severity": "medium"
                }
            ],
            "sql": [
                {
                    "pattern": r"SELECT.*FROM.*WHERE.*\+",
                    "title": "SQL injection vulnerability",
                    "description": "String concatenation in SQL queries enables SQL injection attacks. Always use parameterized queries.",
                    "severity": "critical"
                },
                {
                    "pattern": r"DROP\s+TABLE",
                    "title": "Dangerous DROP TABLE statement",
                    "description": "DROP TABLE operations should be carefully reviewed and protected with proper access controls.",
                    "severity": "high"
                }
            ],
            "cpp": [
                {
                    "pattern": r"strcpy\s*\(",
                    "title": "Buffer overflow risk with strcpy",
                    "description": "strcpy() does not perform bounds checking and can cause buffer overflows. Use strncpy() or safer alternatives like std::string.",
                    "severity": "critical"
                },
                {
                    "pattern": r"strcat\s*\(",
                    "title": "Buffer overflow risk with strcat",
                    "description": "strcat() does not check buffer boundaries and can cause overflows. Use strncat() or std::string instead.",
                    "severity": "critical"
                },
                {
                    "pattern": r"gets\s*\(",
                    "title": "Dangerous use of gets()",
                    "description": "gets() is extremely unsafe and can cause buffer overflows. Use fgets() or std::getline() instead.",
                    "severity": "critical"
                },
                {
                    "pattern": r"sprintf\s*\(",
                    "title": "Buffer overflow risk with sprintf",
                    "description": "sprintf() does not check buffer size and can cause overflows. Use snprintf() instead.",
                    "severity": "high"
                },
                {
                    "pattern": r"scanf\s*\([^,]*,\s*&?\w+\s*\)",
                    "title": "Potential buffer overflow with scanf",
                    "description": "scanf() without width specifiers can cause buffer overflows. Always specify maximum field width.",
                    "severity": "high"
                },
                {
                    "pattern": r"system\s*\(",
                    "title": "Command injection risk",
                    "description": "system() can be vulnerable to command injection. Validate input or use safer alternatives like execve().",
                    "severity": "high"
                },
                {
                    "pattern": r"malloc\s*\([^)]*\)(?!.*free)",
                    "title": "Potential memory leak",
                    "description": "Allocated memory should be freed. Missing free() calls can cause memory leaks.",
                    "severity": "medium"
                },
                {
                    "pattern": r"delete\s+(\w+);.*delete\s+\1",
                    "title": "Double free vulnerability",
                    "description": "Deleting the same pointer twice causes undefined behavior. Set pointers to nullptr after deletion.",
                    "severity": "critical"
                },
                {
                    "pattern": r"(password|secret|api_key|API_KEY)\s*=\s*\"[^\"]+\"",
                    "title": "Hardcoded credentials detected",
                    "description": "Credentials should never be hardcoded. Use environment variables or secure configuration files.",
                    "severity": "critical"
                },
                {
                    "pattern": r"memcpy\s*\(",
                    "title": "Unsafe memory copy",
                    "description": "memcpy() can cause buffer overflows if size is not carefully validated. Ensure bounds checking.",
                    "severity": "high"
                },
                {
                    "pattern": r"printf\s*\(\s*\w+",
                    "title": "Format string vulnerability",
                    "description": "Using variables directly in printf() can cause format string attacks. Use printf(\"%s\", var) instead.",
                    "severity": "high"
                },
                {
                    "pattern": r"rand\s*\(\s*\)",
                    "title": "Weak random number generation",
                    "description": "rand() is not cryptographically secure. Use std::random_device and std::mt19937 for better randomness.",
                    "severity": "medium"
                },
                {
                    "pattern": r"reinterpret_cast\s*<",
                    "title": "Dangerous type casting",
                    "description": "reinterpret_cast is unsafe and can lead to undefined behavior. Use static_cast or dynamic_cast when possible.",
                    "severity": "medium"
                }
            ],
            "c": [
                {
                    "pattern": r"strcpy\s*\(",
                    "title": "Buffer overflow risk with strcpy",
                    "description": "strcpy() does not perform bounds checking and can cause buffer overflows. Use strncpy() instead.",
                    "severity": "critical"
                },
                {
                    "pattern": r"strcat\s*\(",
                    "title": "Buffer overflow risk with strcat",
                    "description": "strcat() does not check buffer boundaries. Use strncat() instead.",
                    "severity": "critical"
                },
                {
                    "pattern": r"gets\s*\(",
                    "title": "Dangerous use of gets()",
                    "description": "gets() is extremely unsafe and removed from C11. Use fgets() instead.",
                    "severity": "critical"
                },
                {
                    "pattern": r"sprintf\s*\(",
                    "title": "Buffer overflow risk with sprintf",
                    "description": "sprintf() does not check buffer size. Use snprintf() instead.",
                    "severity": "high"
                },
                {
                    "pattern": r"system\s*\(",
                    "title": "Command injection risk",
                    "description": "system() can be vulnerable to command injection. Validate all input thoroughly.",
                    "severity": "high"
                },
                {
                    "pattern": r"(password|secret|api_key)\s*=\s*\"[^\"]+\"",
                    "title": "Hardcoded credentials detected",
                    "description": "Credentials should never be hardcoded. Use environment variables.",
                    "severity": "critical"
                },
                {
                    "pattern": r"printf\s*\(\s*\w+",
                    "title": "Format string vulnerability",
                    "description": "Using variables directly in printf() can cause format string attacks. Use printf(\"%s\", var).",
                    "severity": "high"
                }
            ]
        }
    
    async def scan_code(self, code: str, language: str) -> List[Dict[str, Any]]:
        """
        Scan code for security vulnerabilities
        """
        issues = []
        
        # Get patterns for this language
        patterns = self.patterns.get(language, [])
        
        # Scan each line
        lines = code.split('\n')
        for line_num, line in enumerate(lines, 1):
            for pattern_def in patterns:
                if re.search(pattern_def["pattern"], line, re.IGNORECASE):
                    issues.append({
                        "title": pattern_def["title"],
                        "description": pattern_def["description"],
                        "severity": pattern_def["severity"],
                        "line_number": line_num,
                        "code_snippet": line.strip(),
                        "category": "security"
                    })
        
        return issues
