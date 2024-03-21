import { Request, Response } from "express";

class Controller {
  getUserData = (req: Request, res: Response) => {
    res.status(200).json(req.user);
  };
}

export default new Controller();
