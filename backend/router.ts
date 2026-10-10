import { requireAuth, requireRank } from "./middleware/auth.js";
import { Router } from "express";
import { getusers, adduser, deluser, resetuser } from "./controllers/UsersController.js"; 
import { getglobalinfo, checkconnect, getallsession, getUserProfile} from "./controllers/BackController.js"
import { APIsignup, APIsignin, logout } from './controllers/AuthController.js'
import { APIGetClients, addclient, delclient, updateClient, topUpClient } from './controllers/ClientController.js'
import { getgroups, creategroup, deleteGroup, updategroup } from './controllers/GroupController.js'
import { getSchedule, getLessonDetails, closeLesson } from './controllers/ScheduleController.js';
import { get_accupancy_groups, get_transactions_list, 
         getRevenueSources,     getFinancialTimeline, 
         getExpensesStructure,      getClientDebtors, 
         getAllState,                  getChartState,
         getTeachersWorkload,   getAttendanceTrends } 
from './controllers/AnalyticController.js';
import { addManualExpense, getExpenses } from './controllers/FinanceController.js';
import { createLead, getLeads, getLeadById, updateLead, deleteLead } from './controllers/LeadController.js';
import { 
  create_feedback, 
  get_all_feedbacks, 
  get_my_feedbacks, 
  update_feedback, 
  delete_feedback 
} from './controllers/FeedbackController.js';
const router: Router = Router();

router.get('/checkconnect', checkconnect);
router.get("/getsession", requireAuth, requireRank(0), getallsession);
router.get("/getglobalinfo", requireAuth, requireRank(0), getglobalinfo);
router.get("/getcurrentuser", requireAuth, requireRank(0), getUserProfile);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);
router.get("/logout", requireAuth, requireRank(0), logout);

router.post("/adduser", requireAuth, requireRank(1000), adduser);
router.get("/getusers", requireAuth, requireRank(500), getusers);
router.delete("/deluser/:id", requireAuth, requireRank(1000), deluser);
router.post("/resetuser", requireAuth, requireRank(1000), resetuser);

router.get("/getclient", requireAuth, requireRank(500), APIGetClients);
router.post("/addclients", requireAuth, requireRank(500), addclient);
router.delete("/delclients/:id", requireAuth, requireRank(1000), delclient);
router.patch("/updateclient/:id", requireAuth, requireRank(500), updateClient);
router.post("/clients/:id/top-up", requireAuth, requireRank(500), topUpClient);

router.get("/getgroups", requireAuth, requireRank(500), getgroups);
router.post("/creategroup", requireAuth, requireRank(500), creategroup);
router.delete("/deletegroup/:id", requireAuth, requireRank(500), deleteGroup);
router.patch("/updategroup/:id", requireAuth, requireRank(500), updategroup);

router.get("/schedule", requireAuth, requireRank(0), getSchedule);
router.get("/getlessons/:id", requireAuth, requireRank(0), getLessonDetails);
router.post("/lessons/close", requireAuth, requireRank(0), closeLesson);

router.post("/create-lead", requireAuth, requireRank(500), createLead);
router.get("/get-lead", requireAuth, requireRank(500), getLeads);
router.get("/get-lead-by-id/:id", requireAuth, requireRank(500), getLeadById);
router.patch("/update-lead/:id", requireAuth, requireRank(500), updateLead);
router.delete("/delete-lead/:id", requireAuth, requireRank(1000), deleteLead);

router.get("/getaccupancygroups", requireAuth, requireRank(500), get_accupancy_groups);
router.get("/get_transactions_list", requireAuth, requireRank(1000), get_transactions_list);
router.get("/revenue-sources", requireAuth, requireRank(1000), getRevenueSources);
router.get("/getFinancialTimeline", requireAuth, requireRank(1000), getFinancialTimeline);
router.post("/finance/add-expense", requireAuth, requireRank(500), addManualExpense);
router.get("/finance/expenses-structure", requireAuth, requireRank(500), getExpenses);
router.get("/finance/expenses-structure-by-group", requireAuth, requireRank(1000), getExpensesStructure);
router.get("/finance/client-debtors", requireAuth, requireRank(500), getClientDebtors);
router.get("/finance/get-all-state", requireAuth, requireRank(500), getAllState);
router.get("/get-chart-state", requireAuth, requireRank(500), getChartState);
router.get("/hr/get-teachers-workload", requireAuth, requireRank(500), getTeachersWorkload);
router.get("/hr/get-attendance-trends", requireAuth, requireRank(500), getAttendanceTrends);

router.post("/createfeedback", requireAuth, requireRank(0), create_feedback);
router.get('/getfeedbacks', get_all_feedbacks);
router.get("/getmyfeedback", requireAuth, requireRank(0), get_my_feedbacks);
router.put("/updatefeedback/:id", requireAuth, requireRank(0), update_feedback);
router.delete("/deletefeedback/:id", requireAuth, requireRank(0), delete_feedback);
export default router;