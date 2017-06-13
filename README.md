1.	System requirement 
Latest version of node js
2.	Major Features
-	Naïve Bayes Text classification
-	User triggered parameter
-	Event stream triggered file processor 
-	Case folding
-	Stemming
-	Stopword removal
-	Remove escape character

3.	Instruction
- Clone 
- NPM install (if struggling just download zipped file)
-	Put sgml file document inside ‘rawdata’ directory
-	Run ‘node index’ using command prompt in project directory
-	Follow through the prompt dialog
-	Input parameter (enum 1:0)
-	Wait for process
-	After successful check in the output folder whether ‘output’ exist will consist with three documents : 
o	Testdatatested.sgm : Test data file tested and topic already assigned 
o	Trainingdata.sgm : Training data
o	Testingdata.sgm  : Original test data
-	If exist just open it
Example instruction
 
Figure 1 Run the code using node index
 
Figure 2 Follow through "text processing" configuration prompt
 
Figure 3 Wait for Splitting, Training and Testing process
 
Figure 4 After finish the message will show status and will prompt you whether you want to finish or test individual body text
 
Figure 5 Example if you want to test individual body text, you can type it in prompt and end it with new line with "end>" sign
