#npm run L1-static r1-productcatalog.component.yaml > components-ctk-reports/L1-static-ctk.html
#npm run L1-dynamic r1-productcatalog.component.yaml > components-ctk-reports/L1-dynamic-ctk.html
#npm run L2-static r1-productcatalog.component.yaml > components-ctk-reports/L2-static-ctk.html
#npm run L2-dynamic r1-productcatalog.component.yaml > components-ctk-reports/L2-dynamic-ctk.html


npm run L1-static r1-productcatalog.component.yaml 
npm run L1-dynamic r1-productcatalog.component.yaml 
npm run L2-static r1-productcatalog.component.yaml 
npm run L2-dynamic r1-productcatalog.component.yaml

pushd BDDandTDD/TMFC001-productcatalogmanagement
npm install && npm start

popd
pushd api-ctk/TMF620_Product_catalog_V4-0-0
bash Mac-Linux-RUNCTK.sh