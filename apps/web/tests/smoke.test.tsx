import { render, screen } from "@testing-library/react";
import BrandHeader from "../components/BrandHeader";

it("renders Tikun brand header", () => {
  render(<BrandHeader />);
  expect(screen.getByText("Tikun")).toBeInTheDocument();
});
