const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '<HeuresView \n      sessions={sessions} \n      onUpdateSessions={setSessions}\n      workRecords={workRecords}\n      onUpdateWorkRecords={setWorkRecords}\n    />',
  '<HeuresView \n      equipments={equipments}\n      onUpdateEquipments={setEquipments}\n      sessions={sessions} \n      onUpdateSessions={setSessions}\n    />'
);

fs.writeFileSync('src/App.tsx', code);
