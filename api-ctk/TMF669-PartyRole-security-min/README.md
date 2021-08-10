Installing and Running Conformance Test Kit
The CTK is dependent on the installation of node.js and npm to work.
Node.js and NPM can be downloaded and installed from:

>https://nodejs.org/

Once Node.js and npm are installed download and unzip the ZIP file within your test directory.

You should see the following files between many others :

>Windows-BAT-RUNCTK.bat

>Windows-PowerSheel-RUNCTK.ps1

>Linux-RUNCTK.sh

## 1.
### For Windows
For Windows you need to right click Windows-Powershell-RUNCTK.ps1 and select run with PowerShell, press Y and Enter, wait for the dependencies to be installed go to Step 2.
If you don't have access to Powershell you can double click the Windows-BAT-RUNCTK.bat and go to Step 2.
### For Linux and Mac
For Linux and Mac you need to give executable permission for the Mac-Linux-RUNCTK.sh file, you can do that by opening a terminal and typing:
>chmod +x ./Mac-Linux-RUNCTK.sh

and 

>./Mac-Linux-RUNCTK.sh

Wait for NPM to install the dependencies and go to step 2.

## 2.
Configure the URL of your API. The headers and the required payloads on the config.json file.
This file comes configured to point to TM Forum Reference Implementation.

## 3.
After configuring the CTK, run it by running the RUNCTK file for your system.
If there are no configuration errors, there will be 2 outputs, htmlResults and Json Results that you can you examine to see if there is any errors on your API.


If there are no failures then you have passed the CTK and your API conforms with all
the Mandatory features.





