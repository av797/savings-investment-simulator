import api from './client'

// ── Auth ──

export const login = (email, password) =>
  api.post('/users/login', { email, password })

export const register = (data) =>
  api.post('/users/users', data)

export const getMe = () =>
  api.get('/users/me')


// ── Goals ──

export const getGoals = () =>
  api.get('/goals')

export const getGoal = (id) =>
  api.get(`/goals/${id}`)

export const createGoal = (data) =>
  api.post('/goals', data)

export const updateGoal = (id, data) =>
  api.patch(`/goals/${id}`, data)

export const deleteGoal = (id) =>
  api.delete(`/goals/${id}`)


// ── Splits ──

export const getSplits = (goalId) =>
  api.get(`/goals/${goalId}/splits`)

export const setSplits = (goalId, splits) =>
  api.put(`/goals/${goalId}/splits`, { splits })


// ── Simulations ──

export const runSimulation = (goalId) =>
  api.post(`/goals/${goalId}/simulate`)

export const getSimulationHistory = (goalId) =>
  api.get(`/goals/${goalId}/simulations`)

export const getSimulation = (id) =>
  api.get(`/simulations/${id}`)


// ── Dashboard ──

export const getDashboard = () =>
  api.get('/dashboard')