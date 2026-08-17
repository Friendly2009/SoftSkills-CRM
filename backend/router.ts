import { Router } from "express";
import { getusers, adduser, deluser, resetuser } from "./controllers/UsersController.js"; 
import { getglobalinfo, checkconnect, getallsession, getUserProfile} from "./controllers/BackController.js"
import { APIsignup, APIsignin, logout } from './controllers/AuthController.js'
import { APIGetClients, addclient, delclient, updateClient } from './controllers/ClientController.js'
import { getgroups, creategroup, deleteGroup, updategroup } from './controllers/GroupController.js'
import { getSchedule, getLessonDetails, closeLesson } from './controllers/SchesuleController.js';
import { get_accupancy_groups, get_transactions_list, 
         getRevenueSources,     getFinancialTimeline, 
         getExpensesStructure,      getClientDebtors, 
         getAllState,                  getChartState,
         getTeachersWorkload,   getAttendanceTrends } 
from './controllers/AnalyticController.js';
import { addManualExpense, getExpenses } from './controllers/FinanceController.js';
import { createLead, getLeads, getLeadById, updateLead, deleteLead } from './controllers/LeadController.js';
const router: Router = Router();

router.get('/checkconnect', checkconnect);
router.get('/getsession', getallsession);
router.get("/getglobalinfo", getglobalinfo);
router.get("/getcurrentuser", getUserProfile)

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);
router.get("/logout", logout);

router.post("/adduser", adduser);
router.get("/getusers", getusers);
router.delete("/deluser/:id", deluser);
router.post('/resetuser', resetuser);

router.get("/getclient", APIGetClients);
router.post('/addclients', addclient);
router.delete('/delclients/:id', delclient);
router.patch('/updateclient/:id', updateClient);

router.get("/getgroups", getgroups);
router.post('/creategroup', creategroup);
router.delete('/deletegroup/:id', deleteGroup);
router.patch('/updategroup/:id', updategroup);

router.get('/schedule', getSchedule);
router.get('/getlessons/:id', getLessonDetails);
router.post('/lessons/close', closeLesson);

router.post('/create-lead', createLead);
router.get('/get-lead', getLeads);
router.get('/get-lead-by-id/:id', getLeadById);
router.patch('/update-lead/:id', updateLead);
router.delete('/delete-lead/:id', deleteLead);

module.exports = router;

router.get('/getaccupancygroups', get_accupancy_groups);
router.get('/get_transactions_list', get_transactions_list);
router.get('/revenue-sources', getRevenueSources);
router.get('/getFinancialTimeline', getFinancialTimeline);
router.post('/finance/add-expense', addManualExpense);
router.get('/finance/expenses-structure', getExpenses);
router.get("/finance/expenses-structure-by-group", getExpensesStructure);
router.get('/finance/client-debtors', getClientDebtors);
router.get('/finance/get-all-state', getAllState);
router.get('/get-chart-state', getChartState);
router.get('/hr/get-teachers-workload', getTeachersWorkload);
router.get('/hr/get-attendance-trends', getAttendanceTrends);
export default router;