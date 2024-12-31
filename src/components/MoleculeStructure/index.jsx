"use client";
import React, { Component } from "react";
import _ from "lodash";
import PropTypes from "prop-types";
import initRDKitModule from "@rdkit/rdkit";

// Initialize RDKit once and handle loading errors
const initRDKit = (() => {
  let rdkitLoadingPromise;
  return () => {
    if (!rdkitLoadingPromise) {
      rdkitLoadingPromise = initRDKitModule()
        .then((RDKit) => {
          console.log("RDKit loaded successfully");
          return RDKit;
        })
        .catch((error) => {
          console.error("Failed to load RDKit:", error);
          throw error;
        });
    }
    return rdkitLoadingPromise;
  };
})();

class MoleculeStructure extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    className: PropTypes.string,
    svgMode: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    structure: PropTypes.string.isRequired,
    subStructure: PropTypes.string,
    extraDetails: PropTypes.object,
    drawingDelay: PropTypes.number,
    scores: PropTypes.number,
  };

  static defaultProps = {
    subStructure: "",
    className: "",
    width: 250,
    height: 200,
    svgMode: false,
    extraDetails: {},
    drawingDelay: undefined,
    scores: 0,
  };

  constructor(props) {
    super(props);

    this.MOL_DETAILS = {
      width: props.width,
      height: props.height,
      bondLineWidth: 1,
      addStereoAnnotation: true,
      ...props.extraDetails,
    };

    this.state = {
      svg: undefined,
      rdKitLoaded: false,
      rdKitError: false,
    };
  }

  componentDidMount() {
    // Initialize RDKit and set the loaded state once complete
    initRDKit()
      .then((RDKit) => {
        this.RDKit = RDKit;
        this.setState({ rdKitLoaded: true }, this.draw);
      })
      .catch((error) => {
        console.error("RDKit initialization error:", error);
        this.setState({ rdKitError: true });
      });
  }

  componentDidUpdate(prevProps) {
    if (!this.state.rdKitError && this.state.rdKitLoaded) {
      const shouldUpdateDrawing =
        prevProps.structure !== this.props.structure ||
        prevProps.svgMode !== this.props.svgMode ||
        prevProps.subStructure !== this.props.subStructure ||
        prevProps.width !== this.props.width ||
        prevProps.height !== this.props.height ||
        !_.isEqual(prevProps.extraDetails, this.props.extraDetails);

      if (shouldUpdateDrawing) {
        this.draw();
      }
    }
  }

  draw = () => {
    // Delay drawing if specified
    if (this.props.drawingDelay) {
      setTimeout(this.drawSVGorCanvas, this.props.drawingDelay);
    } else {
      this.drawSVGorCanvas();
    }
  };

  drawSVGorCanvas = () => {
    const { structure, subStructure, svgMode, id } = this.props;
  
    const mol = this.RDKit.get_mol(structure || "invalid");
    const qmol = this.RDKit.get_qmol(subStructure || "invalid");
  
    if (!this.isValidMol(mol)) {
      console.error("Invalid molecule structure:", structure);
      mol?.delete();
      qmol?.delete();
      return;
    }
    console.log("Drawing molecule with structure:", structure);

    if (svgMode) {
      this.drawSVG(mol, qmol);
    } else {
      this.drawCanvas(mol, qmol, id);
    }
  
    // Clean up RDKit objects
    mol.delete();
    qmol?.delete();
  };

  drawSVG(mol, qmol) {
    try {
      const svg = mol.get_svg_with_highlights(this.getMolDetails(mol, qmol));
      this.setState({ svg });
    } catch (error) {
      console.error("SVG rendering error:", error);
    }
  }


  drawCanvas(mol, qmol, id) {
    try {
      const canvas = document.getElementById(id);
      if (canvas) {
        mol.draw_to_canvas_with_highlights(canvas, this.getMolDetails(mol, qmol));
      } else {
        console.error("Canvas element not found for id:", id);
      }
    } catch (error) {
      console.error("Canvas rendering error:", error);
    }
  }
  isValidMol(mol) {
    return !!mol && mol.get_num_atoms() > 0 && mol.get_num_bonds() > 0;
  }
  

  getMolDetails(mol, qmol) {
    const { extraDetails } = this.props;
    if (mol && qmol) {
      const subStructDetails = JSON.parse(mol.get_substruct_matches(qmol)) || {};
      const mergedDetails = subStructDetails.reduce(
        (acc, { atoms, bonds }) => ({
          atoms: [...acc.atoms, ...atoms],
          bonds: [...acc.bonds, ...bonds],
        }),
        { atoms: [], bonds: [] }
      );
      return JSON.stringify({ ...this.MOL_DETAILS, ...extraDetails, ...mergedDetails });
    }
    return JSON.stringify({ ...this.MOL_DETAILS, ...extraDetails });
  }

  render() {
    const { rdKitLoaded, rdKitError, svg } = this.state;
    const { structure, svgMode, className, width, height, scores } = this.props;

    if (rdKitError) return <span>Error loading RDKit renderer.</span>;
    if (!rdKitLoaded) return <span>Loading RDKit renderer...</span>;

    const mol = this.RDKit.get_mol(structure || "invalid");
    if (!this.isValidMol(mol)) {
      mol.delete();
      return <span title={`Cannot render structure: ${structure}`}>Render Error.</span>;
    }
    mol.delete();

    return svgMode ? (
      <div
        title={structure}
        className={`molecule-structure-svg ${className}`}
        style={{ width, height }}
        dangerouslySetInnerHTML={{ __html: svg }}
      ></div>
    ) : (
      <div className={`molecule-canvas-container ${className}`}>
        <canvas title={structure} id={this.props.id} width={width} height={height}></canvas>
        {scores ? <p className="text-red-600 z-50 p-10">Score: {scores.toFixed(2)}</p> : null}
      </div>
    );
  }
}

export default MoleculeStructure;
